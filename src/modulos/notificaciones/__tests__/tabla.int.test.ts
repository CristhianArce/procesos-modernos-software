import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tabla-notif-${randomUUID().slice(0, 8)}`;
const semilla = readFileSync("db/seed/notificaciones.sql", "utf8");
const IDS_SEMILLA = [1, 2, 3, 4, 5].map((n) => `7a1c0001-0000-4000-8000-00000000000${n}`);
let destinatarioId: string;

const insertar = (destinatario: string, sensor = "Sensor de prueba", magnitud = "voltaje") =>
  db().query(
    "INSERT INTO notificaciones (destinatario_id, sensor, magnitud, valor, creada_en) VALUES ($1, $2, $3, 130, now()) RETURNING *",
    [destinatario, sensor, magnitud],
  );

beforeAll(async () => {
  destinatarioId = (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [prefijo])
  ).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario = $1", [prefijo]);
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("tabla notificaciones", () => {
  it("#24 CA-1: tiene las columnas esperadas y ninguna de umbral ni de nodo", async () => {
    const { rows } = await db().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones'");
    const columnas = rows.map((r) => r.column_name).sort();
    expect(columnas).toEqual(["creada_en", "destinatario_id", "id", "leida", "magnitud", "sensor", "valor"]);
  });

  it("#24 CA-1: guarda la notificación con id generado y no leída por defecto", async () => {
    const { rows } = await insertar(destinatarioId);
    expect(rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows[0].leida).toBe(false);
    expect(rows[0].creada_en).toBeInstanceOf(Date);
  });

  it("#24 CA-1: rechaza una magnitud desconocida", async () => {
    await expect(insertar(destinatarioId, "Sensor de prueba", "frecuencia")).rejects.toMatchObject({ code: "23514" });
  });

  it("#24 CA-1: permite varias notificaciones de la misma alerta para distintos destinatarios", async () => {
    const otro = (
      await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-b`])
    ).rows[0].id;
    await insertar(destinatarioId, "Sensor repetido");
    await insertar(otro, "Sensor repetido");
    await db().query("DELETE FROM usuarios WHERE id = $1", [otro]);
  });

  it("#24 CA-1: eliminar el sensor de origen no elimina la notificación (copia del nombre)", async () => {
    const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
    const nombre = `${prefijo}-sensor`;
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $2)", [nodoId, nombre]);
    await insertar(destinatarioId, nombre);
    await db().query("DELETE FROM nodos WHERE id = $1", [nodoId]);
    const { rows } = await db().query("SELECT sensor FROM notificaciones WHERE destinatario_id = $1 AND sensor = $2", [destinatarioId, nombre]);
    expect(rows).toHaveLength(1);
    expect(rows[0].sensor).toBe(nombre);
  });

  it("#24 CA-1: eliminar al destinatario elimina sus notificaciones", async () => {
    const id = (
      await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [`${prefijo}-c`])
    ).rows[0].id;
    await insertar(id);
    await db().query("DELETE FROM usuarios WHERE id = $1", [id]);
    expect((await db().query("SELECT 1 FROM notificaciones WHERE destinatario_id = $1", [id])).rowCount).toBe(0);
  });
});

describe("semilla de notificaciones", () => {
  // La semilla de notificaciones lee las cuentas de la HU 3; en una base recién migrada hay que cargarlas antes.
  beforeAll(async () => {
    await db().query(readFileSync("db/seed/auth.sql", "utf8"));
  });

  it("#24 CA-1: aplicada dos veces deja a tecnico con leídas y sin leer, sin duplicados", async () => {
    await db().query(semilla);
    await db().query(semilla);
    const { rows } = await db().query(
      `SELECT n.id, n.leida FROM notificaciones n JOIN usuarios u ON u.id = n.destinatario_id
       WHERE u.nombre_usuario = 'tecnico' AND n.id = ANY($1::uuid[])`,
      [IDS_SEMILLA],
    );
    expect(rows).toHaveLength(5);
    expect(rows.filter((r) => r.leida)).toHaveLength(2);
    expect(rows.filter((r) => !r.leida)).toHaveLength(3);
  });

  it("#24 CA-1: la cuenta admin no tiene ninguna notificación", async () => {
    await db().query(semilla);
    const { rows } = await db().query(
      "SELECT 1 FROM notificaciones n JOIN usuarios u ON u.id = n.destinatario_id WHERE u.nombre_usuario = 'admin'",
    );
    expect(rows).toHaveLength(0);
  });
});
