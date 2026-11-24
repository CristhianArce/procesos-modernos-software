import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { COOKIE_SESION, firmarSesion, type Rol } from "@/lib/session";
import { peticion } from "@/test/api";
import { GET } from "@/app/api/notificaciones/route";

const prefijo = `int-api-notif-${randomUUID().slice(0, 8)}`;
const RUTA = "/api/notificaciones";
let tecnicoA: string;
let tecnicoB: string;

const crearUsuario = async (sufijo: string) =>
  (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'x', 'tecnico') RETURNING id", [
      `${prefijo}-${sufijo}`,
    ])
  ).rows[0].id as string;

const insertar = (usuario: string, sensor: string, fecha: string, leida: boolean) =>
  db().query(
    `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
     VALUES ($1, $2, 'voltaje', 130, $3, $4)`,
    [usuario, sensor, fecha, leida],
  );

// Sesión con el id real del usuario como `sub` (la ayuda `peticion` usa un sub ficticio).
async function comoUsuario(id: string, ruta = RUTA, rol: Rol = "tecnico"): Promise<Request> {
  const cookie = `${COOKIE_SESION}=${await firmarSesion({ sub: id, rol })}`;
  return new Request(`http://localhost${ruta}`, { method: "GET", headers: { cookie } });
}

beforeAll(async () => {
  tecnicoA = await crearUsuario("a");
  tecnicoB = await crearUsuario("b");
  await insertar(tecnicoA, "a-antigua", "2026-03-01T10:00:00Z", true);
  await insertar(tecnicoA, "a-media", "2026-03-02T10:00:00Z", false);
  await insertar(tecnicoA, "a-reciente", "2026-03-03T10:00:00Z", false);
  await insertar(tecnicoB, "b-1", "2026-03-04T10:00:00Z", false);
  await insertar(tecnicoB, "b-2", "2026-03-05T10:00:00Z", false);
  await insertar(tecnicoB, "b-3", "2026-03-06T10:00:00Z", false);
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("API de notificaciones", () => {
  it("#24 CA-1: un técnico recibe 200 con sus notificaciones, la más reciente primero, y el número de no leídas", async () => {
    const res = await GET(await comoUsuario(tecnicoA), undefined);

    expect(res.status).toBe(200);
    const cuerpo = await res.json();
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["a-reciente", "a-media", "a-antigua"]);
    expect(cuerpo.notificaciones[0]).toEqual({
      id: expect.any(String),
      sensor: "a-reciente",
      magnitud: "voltaje",
      valor: 130,
      fecha: "2026-03-03T10:00:00.000Z",
      leida: false,
    });
    expect(cuerpo.noLeidas).toBe(2);
  });

  it("#24 CA-1: un técnico sin notificaciones recibe lista vacía y 0", async () => {
    const vacio = await crearUsuario("vacio");
    const res = await GET(await comoUsuario(vacio), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ notificaciones: [], noLeidas: 0 });
  });

  it("#24 CA-1: con 60 notificaciones lista las 50 más recientes y cuenta las 55 no leídas", async () => {
    const u = await crearUsuario("muchas");
    await db().query(
      `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
       SELECT $1, 's' || g, 'voltaje', 1, now() - (g || ' minute')::interval, g > 5
       FROM generate_series(1, 60) g`,
      [u],
    );
    // g > 5 es "leída": 55 leídas y 5 sin leer; se invierte para tener 55 sin leer.
    await db().query("UPDATE notificaciones SET leida = NOT leida WHERE usuario_id = $1", [u]);

    const cuerpo = await (await GET(await comoUsuario(u), undefined)).json();

    expect(cuerpo.notificaciones).toHaveLength(50);
    expect(cuerpo.notificaciones[0].sensor).toBe("s1");
    expect(cuerpo.noLeidas).toBe(55);
  });

  it("#24 CA-2: un técnico no ve las del otro", async () => {
    const cuerpo = await (await GET(await comoUsuario(tecnicoB), undefined)).json();
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["b-3", "b-2", "b-1"]);
    expect(cuerpo.noLeidas).toBe(3);
  });

  it("#24 CA-2: ignora un identificador de usuario enviado en la URL", async () => {
    const res = await GET(await comoUsuario(tecnicoA, `${RUTA}?usuarioId=${tecnicoB}&usuario_id=${tecnicoB}`), undefined);
    const cuerpo = await res.json();
    expect(res.status).toBe(200);
    expect(cuerpo.notificaciones.map((n: { sensor: string }) => n.sensor)).toEqual(["a-reciente", "a-media", "a-antigua"]);
    expect(cuerpo.noLeidas).toBe(2);
  });

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
});
