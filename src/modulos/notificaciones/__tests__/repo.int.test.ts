import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listarDeUsuario, MAXIMO_NOTIFICACIONES } from "../repo";

const prefijo = `int-repo-notif-${randomUUID().slice(0, 8)}`;
let ana: string;
let beto: string;
let vacio: string;
let masivo: string;

const usuario = async (sufijo: string) =>
  (await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-${sufijo}`])).rows[0].id as string;

const insertar = (usuarioId: string, sensor: string, horas: number, leida = false, id: string = randomUUID()) =>
  db().query(
    `INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en, leida)
     VALUES ($1, $2, $3, 'voltaje', 130, now() - make_interval(hours => $4::int), $5)`,
    [id, usuarioId, sensor, horas, leida],
  );

beforeAll(async () => {
  [ana, beto, vacio, masivo] = [await usuario("ana"), await usuario("beto"), await usuario("vacio"), await usuario("masivo")];
  await insertar(ana, "vieja", 3, true);
  await insertar(ana, "reciente", 1);
  await insertar(ana, "media", 2);
  await insertar(beto, "de-beto", 1);
  await db().query(
    `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en)
     SELECT $1, 's' || n, 'voltaje', 130, now() - make_interval(secs => n) FROM generate_series(1, $2::int) n`,
    [masivo, MAXIMO_NOTIFICACIONES + 1],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("repo de notificaciones", () => {
  it("#24 CA-1: lista de la más reciente a la más antigua y cuenta las no leídas", async () => {
    const r = await listarDeUsuario(ana);
    expect(r.notificaciones.map((n) => n.sensor)).toEqual(["reciente", "media", "vieja"]);
    expect(r.noLeidas).toBe(2);
    expect(r.notificaciones[0]).toEqual({
      id: expect.any(String),
      sensor: "reciente",
      magnitud: "voltaje",
      valor: 130,
      fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      leida: false,
    });
    expect(r.notificaciones[2].leida).toBe(true);
  });

  it("#24 CA-1: un usuario sin notificaciones recibe lista vacía y 0 no leídas", async () => {
    expect(await listarDeUsuario(vacio)).toEqual({ notificaciones: [], noLeidas: 0 });
  });

  it("#24 CA-2: no devuelve notificaciones de otro usuario", async () => {
    const r = await listarDeUsuario(beto);
    expect(r.notificaciones.map((n) => n.sensor)).toEqual(["de-beto"]);
    expect(r.noLeidas).toBe(1);
  });

  it("#24 CA-1: noLeidas cuenta todas aunque la lista tenga tope", async () => {
    const r = await listarDeUsuario(masivo);
    expect(r.notificaciones).toHaveLength(MAXIMO_NOTIFICACIONES);
    expect(r.noLeidas).toBe(MAXIMO_NOTIFICACIONES + 1);
  });

  it("#24 CA-1: desempata por id descendente cuando la fecha de la alerta coincide", async () => {
    const u = await usuario("empate");
    await db().query(
      `INSERT INTO notificaciones (id, usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES
         ('00000000-0000-4000-8000-0000000000a1', $1, 'a1', 'voltaje', 1, '2026-01-01T00:00:00Z'),
         ('00000000-0000-4000-8000-0000000000a2', $1, 'a2', 'voltaje', 1, '2026-01-01T00:00:00Z')`,
      [u],
    );
    expect((await listarDeUsuario(u)).notificaciones.map((n) => n.sensor)).toEqual(["a2", "a1"]);
  });
});
