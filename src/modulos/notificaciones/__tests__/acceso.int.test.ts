import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "@/app/api/notificaciones/route";
import { db } from "@/lib/db";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";
import { peticion } from "@/test/api";
import { insertar } from "../repo";

const prefijo = `int-acceso-notif-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/notificaciones";
const base = Date.now() - 24 * 3600 * 1000;
let tecnicoA: string;
let tecnicoB: string;
let vacio: string;

const crearUsuario = async (sufijo: string) =>
  (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [
      `${prefijo}-${sufijo}`,
    ])
  ).rows[0].id as string;

const nueva = (destinatarioId: string, minuto: number, leida = false) =>
  insertar({
    destinatarioId,
    sensor: `${prefijo}-sensor`,
    magnitud: "corriente",
    valor: 10 + minuto,
    creadaEn: new Date(base + minuto * 60_000).toISOString(),
    leida,
  });

async function comoTecnico(id: string, consulta = ""): Promise<Request> {
  process.env.SESSION_SECRET ??= "x".repeat(32);
  const sesion = await firmarSesion({ sub: id, rol: "tecnico" });
  return new Request(`http://localhost${RUTA}${consulta}`, { headers: { cookie: `${COOKIE_SESION}=${sesion}` } });
}

beforeAll(async () => {
  tecnicoA = await crearUsuario("a");
  tecnicoB = await crearUsuario("b");
  vacio = await crearUsuario("vacio");
  await nueva(tecnicoA, 1, true);
  await nueva(tecnicoA, 2);
  await nueva(tecnicoA, 3);
  await nueva(tecnicoB, 20);
  await nueva(tecnicoB, 21, true);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("API de notificaciones", () => {
  it("#24 CA-3: sin sesión responde 401 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#24 CA-3: un administrador recibe 403 en JSON y ninguna notificación", async () => {
    const res = await GET(await peticion("GET", RUTA, { rol: "administrador" }), undefined);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "Sin permiso" });
  });

  it("#24 CA-1: un técnico recibe sus notificaciones, la más reciente primero, y su noLeidas", async () => {
    const res = await GET(await comoTecnico(tecnicoA), undefined);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.noLeidas).toBe(2);
    expect(cuerpo.notificaciones.map((n: { valor: number }) => n.valor)).toEqual([13, 12, 11]);
    expect(cuerpo.notificaciones[0]).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      sensor: `${prefijo}-sensor`,
      magnitud: "corriente",
      valor: 13,
      creadaEn: new Date(base + 3 * 60_000).toISOString(),
      leida: false,
    });
    expect(cuerpo.notificaciones[2].leida).toBe(true);
  });

  it("#24 CA-1: un técnico sin notificaciones recibe noLeidas 0 y lista vacía", async () => {
    const res = await GET(await comoTecnico(vacio), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ noLeidas: 0, notificaciones: [] });
  });

  it("#24 CA-2: con dos técnicos cada uno ve solo las suyas y cuenta solo sus no leídas", async () => {
    const deB = await (await GET(await comoTecnico(tecnicoB), undefined)).json();
    expect(deB.notificaciones.map((n: { valor: number }) => n.valor)).toEqual([31, 30]);
    expect(deB.noLeidas).toBe(1);
    const deA = await (await GET(await comoTecnico(tecnicoA), undefined)).json();
    expect(deA.notificaciones).toHaveLength(3);
    expect(deA.notificaciones.map((n: { valor: number }) => n.valor)).not.toContain(30);
  });

  it("#24 CA-2: ignora ?destinatarioId= y responde con las del técnico de la sesión", async () => {
    const res = await GET(await comoTecnico(tecnicoA, `?destinatarioId=${tecnicoB}`), undefined);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.notificaciones.map((n: { valor: number }) => n.valor)).toEqual([13, 12, 11]);
    expect(cuerpo.noLeidas).toBe(2);
  });
});
