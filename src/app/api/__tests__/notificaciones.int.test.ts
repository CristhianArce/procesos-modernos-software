import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";
import { peticion } from "@/test/api";
import { GET } from "../notificaciones/route";

const prefijo = `int-api-notif-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/notificaciones";
let ana: string;
let beto: string;

const usuario = async (sufijo: string) =>
  (await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-${sufijo}`])).rows[0].id as string;

const insertar = (usuarioId: string, sensor: string, horas: number, leida = false) =>
  db().query(
    `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
     VALUES ($1, $2, 'corriente', 17.2, now() - make_interval(hours => $3::int), $4)`,
    [usuarioId, sensor, horas, leida],
  );

/** Petición con la sesión real del técnico: `sub` es su `usuarios.id`. */
const comoUsuario = async (sub: string, ruta = RUTA) =>
  new Request(`http://localhost${ruta}`, { headers: { cookie: `${COOKIE_SESION}=${await firmarSesion({ sub, rol: "tecnico" })}` } });

beforeAll(async () => {
  ana = await usuario("ana");
  beto = await usuario("beto");
  await insertar(ana, "ana-vieja", 2, true);
  await insertar(ana, "ana-reciente", 1);
  await insertar(beto, "beto-unica", 1);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("API de notificaciones", () => {
  it("#24 CA-3: sin sesión responde 401 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#24 CA-3: un administrador recibe 403 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA, { rol: "administrador" }), undefined);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("#24 CA-1: el técnico recibe lista ordenada y noLeidas", async () => {
    const res = await GET(await comoUsuario(ana), undefined);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["ana-reciente", "ana-vieja"]);
    expect(cuerpo.noLeidas).toBe(1);
    expect(cuerpo.notificaciones[0]).toEqual({
      id: expect.any(String),
      sensor: "ana-reciente",
      magnitud: "corriente",
      valor: 17.2,
      fecha: expect.any(String),
      leida: false,
    });
  });

  it("#24 CA-2: dos técnicos con sesión propia no ven las del otro", async () => {
    const deBeto = await (await GET(await comoUsuario(beto), undefined)).json();
    expect(deBeto.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["beto-unica"]);
    expect(deBeto.noLeidas).toBe(1);

    const deAna = await (await GET(await comoUsuario(ana), undefined)).json();
    expect(deAna.notificaciones.map((n: { sensor: string }) => n.sensor)).not.toContain("beto-unica");
  });

  it("#24 CA-2: un identificador de otro usuario en la consulta no cambia el destinatario", async () => {
    const res = await GET(await comoUsuario(ana, `${RUTA}?usuarioId=${beto}&usuario_id=${beto}&sub=${beto}`), undefined);
    const cuerpo = await res.json();
    expect(res.status).toBe(200);
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["ana-reciente", "ana-vieja"]);
    expect(cuerpo.noLeidas).toBe(1);
  });
});
