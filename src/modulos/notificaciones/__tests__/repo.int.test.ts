import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contarNoLeidas, listarDeUsuario } from "../repo";

const prefijo = `int-repo-notif-${randomUUID().slice(0, 8)}`;
let usuarioA: string;
let usuarioB: string;

const crearUsuario = async (sufijo: string) =>
  (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'x', 'tecnico') RETURNING id", [
      `${prefijo}-${sufijo}`,
    ])
  ).rows[0].id as string;

const insertar = (usuario: string, sensor: string, fecha: string, leida = false, id?: string) =>
  db().query(
    `INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, 'voltaje', 130, $4, $5)`,
    [id ?? null, usuario, sensor, fecha, leida],
  );

beforeAll(async () => {
  usuarioA = await crearUsuario("a");
  usuarioB = await crearUsuario("b");
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("repo de notificaciones", () => {
  it("#24 CA-1: la más reciente primero y, en empate de fecha, el id mayor", async () => {
    const u = await crearUsuario("orden");
    await insertar(u, "antigua", "2026-01-01T10:00:00Z");
    await insertar(u, "empate-menor", "2026-01-03T10:00:00Z", false, "00000000-0000-4000-8000-000000000001");
    await insertar(u, "empate-mayor", "2026-01-03T10:00:00Z", false, "ffffffff-0000-4000-8000-000000000001");
    await insertar(u, "reciente", "2026-01-05T10:00:00Z");

    const lista = await listarDeUsuario(u, 50);

    expect(lista.map((n) => n.sensor)).toEqual(["reciente", "empate-mayor", "empate-menor", "antigua"]);
    expect(lista[0]).toEqual({
      id: expect.any(String),
      sensor: "reciente",
      magnitud: "voltaje",
      valor: 130,
      fecha: "2026-01-05T10:00:00.000Z",
      leida: false,
    });
  });

  it("#24 CA-1: respeta el límite y cuenta las no leídas sobre el total", async () => {
    const u = await crearUsuario("limite");
    await db().query(
      `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
       SELECT $1, 's' || g, 'voltaje', 1, now() - (g || ' minute')::interval, g > 5
       FROM generate_series(1, 60) g`,
      [u],
    );

    expect(await listarDeUsuario(u, 50)).toHaveLength(50);
    expect(await listarDeUsuario(u, 3)).toHaveLength(3);
    expect(await contarNoLeidas(u)).toBe(5);
  });

  it("#24 CA-2: solo devuelve y cuenta las del usuario", async () => {
    await insertar(usuarioA, "de-a-1", "2026-02-01T10:00:00Z");
    await insertar(usuarioA, "de-a-2", "2026-02-02T10:00:00Z", true);
    await insertar(usuarioB, "de-b-1", "2026-02-03T10:00:00Z");
    await insertar(usuarioB, "de-b-2", "2026-02-04T10:00:00Z");
    await insertar(usuarioB, "de-b-3", "2026-02-05T10:00:00Z");

    expect((await listarDeUsuario(usuarioA, 50)).map((n) => n.sensor)).toEqual(["de-a-2", "de-a-1"]);
    expect(await contarNoLeidas(usuarioA)).toBe(1);
    expect(await contarNoLeidas(usuarioB)).toBe(3);
  });
});
