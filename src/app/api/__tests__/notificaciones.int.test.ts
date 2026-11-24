import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { COOKIE_SESION, firmarSesion, type Rol } from "@/lib/session";
import { peticion } from "@/test/api";
import { GET } from "../notificaciones/route";

const prefijo = `int-api-notif-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/notificaciones";
let a: string;
let b: string;

const crearUsuario = async (sufijo: string) =>
  (await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-${sufijo}`]))
    .rows[0].id as string;

// peticion() firma sub "prueba-<rol>"; aquí la sesión lleva el id real del usuario.
const conSesion = async (ruta: string, sub: string, rol: Rol = "tecnico") =>
  new Request(`http://localhost${ruta}`, { headers: { cookie: `${COOKIE_SESION}=${await firmarSesion({ sub, rol })}` } });

beforeAll(async () => {
  [a, b] = [await crearUsuario("a"), await crearUsuario("b")];
  await db().query(
    `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida) VALUES
       ($1, 'a-vieja', 'voltaje', 126, now() - interval '2 hour', true),
       ($1, 'a-reciente', 'potencia', 2000, now() - interval '1 hour', false),
       ($2, 'b-unica', 'corriente', 16, now(), false)`,
    [a, b],
  );
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

  it("#24 CA-3: un administrador recibe 403 en JSON", async () => {
    const res = await GET(await peticion("GET", RUTA, { rol: "administrador" }), undefined);
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("#24 CA-1: el técnico recibe lista ordenada y noLeidas", async () => {
    const res = await GET(await conSesion(RUTA, a), undefined);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["a-reciente", "a-vieja"]);
    expect(cuerpo.noLeidas).toBe(1);
    expect(cuerpo.notificaciones[0]).toEqual({
      id: expect.any(String),
      sensor: "a-reciente",
      magnitud: "potencia",
      valor: 2000,
      fecha: expect.any(String),
      leida: false,
    });
    expect(cuerpo.notificaciones[0]).not.toHaveProperty("umbral");
  });

  it("#24 CA-2: dos técnicos con sesión propia no ven las del otro", async () => {
    const deB = await (await GET(await conSesion(RUTA, b), undefined)).json();
    expect(deB.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["b-unica"]);
    expect(deB.noLeidas).toBe(1);

    const deA = await (await GET(await conSesion(RUTA, a), undefined)).json();
    expect(deA.notificaciones.map((n: { sensor: string }) => n.sensor)).not.toContain("b-unica");
  });

  it("#24 CA-2: un identificador de otro usuario en la consulta no cambia el destinatario", async () => {
    const res = await GET(await conSesion(`${RUTA}?usuarioId=${b}&usuario_id=${b}`, a), undefined);
    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["a-reciente", "a-vieja"]);
    expect(cuerpo.noLeidas).toBe(1);
  });
});
