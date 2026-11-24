import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/notificaciones/route";
import { PATCH } from "@/app/api/notificaciones/[id]/route";
import { db } from "@/lib/db";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";
import { conId, peticion } from "@/test/api";
import { insertar, recientesDe } from "../repo";

const prefijo = `int-marcar-api-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/notificaciones";
const base = Date.now() - 24 * 3600 * 1000;
let tecnicoA: string;
let tecnicoB: string;
let a1: string;
let a2: string;
let aLeida: string;
let b1: string;

const crearUsuario = async (sufijo: string) =>
  (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [
      `${prefijo}-${sufijo}`,
    ])
  ).rows[0].id as string;

const nueva = async (destinatarioId: string, minuto: number, leida = false) => {
  await insertar({
    destinatarioId,
    sensor: `${prefijo}-sensor`,
    magnitud: "corriente",
    valor: 10 + minuto,
    creadaEn: new Date(base + minuto * 60_000).toISOString(),
    leida,
  });
  return (await recientesDe(destinatarioId)).find((n) => n.valor === 10 + minuto)!.id;
};

async function comoTecnico(id: string, ruta: string, metodo = "PATCH", cuerpo?: unknown): Promise<Request> {
  process.env.SESSION_SECRET ??= "x".repeat(32);
  const sesion = await firmarSesion({ sub: id, rol: "tecnico" });
  const headers: Record<string, string> = { cookie: `${COOKIE_SESION}=${sesion}` };
  if (cuerpo !== undefined) headers["content-type"] = "application/json";
  return new Request(`http://localhost${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
}

const listaDe = async (tecnico: string) => (await GET(await comoTecnico(tecnico, RUTA, "GET"), undefined)).json();
const estadoDe = async (tecnico: string, id: string) => (await recientesDe(tecnico)).find((n) => n.id === id)?.leida;

beforeAll(async () => {
  tecnicoA = await crearUsuario("a");
  tecnicoB = await crearUsuario("b");
  a1 = await nueva(tecnicoA, 1);
  a2 = await nueva(tecnicoA, 2);
  aLeida = await nueva(tecnicoA, 3, true);
  b1 = await nueva(tecnicoB, 20);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API PATCH /api/notificaciones/{id}", () => {
  it("#53 CA-1: un técnico marca una suya, recibe 200 con leida true y la lista la conserva con una sin leer menos", async () => {
    expect((await listaDe(tecnicoA)).noLeidas).toBe(2);
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/${a1}`), conId(a1));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: a1,
      sensor: `${prefijo}-sensor`,
      magnitud: "corriente",
      valor: 11,
      creadaEn: new Date(base + 60_000).toISOString(),
      leida: true,
    });
    const lista = await listaDe(tecnicoA);
    expect(lista.noLeidas).toBe(1);
    expect(lista.notificaciones).toHaveLength(3);
    expect(lista.notificaciones.find((n: { id: string }) => n.id === a1).leida).toBe(true);
  });

  it("#53 CA-1: marcar una ya leída responde 200 y noLeidas no cambia", async () => {
    const antes = (await listaDe(tecnicoA)).noLeidas;
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/${aLeida}`), conId(aLeida));
    expect(res.status).toBe(200);
    expect((await res.json()).leida).toBe(true);
    expect((await listaDe(tecnicoA)).noLeidas).toBe(antes);
  });

  it("#53 CA-1: un cuerpo { leida: false } se ignora y responde 200 con leida true", async () => {
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/${a2}`, "PATCH", { leida: false }), conId(a2));
    expect(res.status).toBe(200);
    expect((await res.json()).leida).toBe(true);
    expect(await estadoDe(tecnicoA, a2)).toBe(true);
  });

  it("#53 CA-2: una notificación de otro técnico responde 404 en JSON y sigue sin leer", async () => {
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/${b1}`), conId(b1));
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "Notificación no encontrada" });
    expect(await estadoDe(tecnicoB, b1)).toBe(false);
  });

  it("#53 CA-2: un UUID inexistente responde 404 con el mismo mensaje", async () => {
    const id = randomUUID();
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/${id}`), conId(id));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Notificación no encontrada" });
  });

  it("#53 CA-3: sin sesión responde 401 en JSON y la notificación no cambia", async () => {
    const res = await PATCH(await peticion("PATCH", `${RUTA}/${b1}`), conId(b1));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
    expect(await estadoDe(tecnicoB, b1)).toBe(false);
  });

  it("#53 CA-3: un administrador recibe 403 en JSON y la notificación no cambia", async () => {
    const res = await PATCH(await peticion("PATCH", `${RUTA}/${b1}`, { rol: "administrador" }), conId(b1));
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "Sin permiso" });
    expect(await estadoDe(tecnicoB, b1)).toBe(false);
  });

  it("#53 CA-3: con un id mal formado, sin sesión es 401 y administrador 403 (antes de validar el id)", async () => {
    expect((await PATCH(await peticion("PATCH", `${RUTA}/no-es-un-uuid`), conId("no-es-un-uuid"))).status).toBe(401);
    const admin = await peticion("PATCH", `${RUTA}/no-es-un-uuid`, { rol: "administrador" });
    expect((await PATCH(admin, conId("no-es-un-uuid"))).status).toBe(403);
  });

  it("#53 CA-4: un técnico con no-es-un-uuid recibe 400 con el detalle del campo id", async () => {
    const res = await PATCH(await comoTecnico(tecnicoA, `${RUTA}/no-es-un-uuid`), conId("no-es-un-uuid"));
    expect(res.status).toBe(400);
    const cuerpo = await res.json();
    expect(cuerpo.error).toBe("Datos inválidos");
    expect(cuerpo.detalles).toEqual([expect.objectContaining({ campo: "id" })]);
  });
});
