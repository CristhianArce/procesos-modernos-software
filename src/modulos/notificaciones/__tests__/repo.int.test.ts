import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listarDeUsuario, MAXIMO_NOTIFICACIONES } from "../repo";

const prefijo = `int-repo-notif-${randomUUID().slice(0, 8)}`;
let a: string;
let b: string;
let c: string;

const crearUsuario = async (sufijo: string) =>
  (await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-${sufijo}`]))
    .rows[0].id as string;

beforeAll(async () => {
  [a, b, c] = [await crearUsuario("a"), await crearUsuario("b"), await crearUsuario("c")];
  await db().query(
    `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida) VALUES
       ($1, 'vieja', 'voltaje', 126, now() - interval '3 hour', true),
       ($1, 'reciente', 'potencia', 2000, now() - interval '1 hour', false),
       ($1, 'media', 'corriente', 16, now() - interval '2 hour', false),
       ($2, 'ajena', 'voltaje', 130, now(), false)`,
    [a, b],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de notificaciones", () => {
  it("#24 CA-1: lista de la más reciente a la más antigua y cuenta las no leídas", async () => {
    const res = await listarDeUsuario(a);
    expect(res.notificaciones.map((n) => n.sensor)).toEqual(["reciente", "media", "vieja"]);
    expect(res.noLeidas).toBe(2);
    expect(res.notificaciones[0]).toEqual({
      id: expect.any(String),
      sensor: "reciente",
      magnitud: "potencia",
      valor: 2000,
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      leida: false,
    });
    expect(res.notificaciones[2].leida).toBe(true);
  });

  it("#24 CA-1: un técnico sin notificaciones recibe lista vacía y 0 no leídas", async () => {
    expect(await listarDeUsuario(c)).toEqual({ notificaciones: [], noLeidas: 0 });
  });

  it("#24 CA-2: no devuelve notificaciones de otro usuario", async () => {
    const res = await listarDeUsuario(b);
    expect(res.notificaciones.map((n) => n.sensor)).toEqual(["ajena"]);
    expect(res.noLeidas).toBe(1);
  });

  it("#24 CA-1: noLeidas cuenta todas aunque la lista tenga tope", async () => {
    const d = await crearUsuario("d");
    const total = MAXIMO_NOTIFICACIONES + 5;
    await db().query(
      `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en)
       SELECT $1, 's' || n, 'voltaje', 130, now() - (n || ' minute')::interval FROM generate_series(1, $2::int) AS n`,
      [d, total],
    );
    const res = await listarDeUsuario(d);
    expect(res.notificaciones).toHaveLength(MAXIMO_NOTIFICACIONES);
    expect(res.noLeidas).toBe(total);
    expect(res.notificaciones[0].sensor).toBe("s1");
  });
});
