import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tabla-notif-${randomUUID().slice(0, 8)}`;
let usuarioId: string;

beforeAll(async () => {
  usuarioId = (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'hash-de-prueba', 'tecnico') RETURNING id", [prefijo])
  ).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario = $1", [prefijo]);
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("tabla notificaciones", () => {
  it("#24 CA-1: la tabla guarda sensor_nombre sin clave foránea ni umbral", async () => {
    const columnas = (
      await db().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones'")
    ).rows.map((f) => f.column_name);
    expect(columnas).toEqual(
      expect.arrayContaining(["id", "usuario_id", "sensor_nombre", "magnitud", "valor", "alerta_creada_en", "leida", "creada_en"]),
    );
    expect(columnas).not.toContain("umbral");
    expect(columnas).not.toContain("nodo_id");
    expect(columnas).not.toContain("sensor_id");

    const { rows } = await db().query(
      `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en)
       VALUES ($1, 'Sensor propio', 'voltaje', 130, now()) RETURNING *`,
      [usuarioId],
    );
    expect(rows[0]).toMatchObject({ usuario_id: usuarioId, sensor_nombre: "Sensor propio", magnitud: "voltaje", valor: 130, leida: false });
    expect(rows[0].creada_en).toBeInstanceOf(Date);

    const claves = await db().query("SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'notificaciones' AND constraint_type = 'FOREIGN KEY'");
    expect(claves.rowCount).toBe(1); // solo usuario_id
  });

  it("#24 CA-1: rechaza una magnitud desconocida", async () => {
    await expect(
      db().query(
        "INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, 's', 'frecuencia', 1, now())",
        [usuarioId],
      ),
    ).rejects.toThrow();
  });

  it("#24 CA-1: la notificación sobrevive al borrado del sensor", async () => {
    const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
    const sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'Sensor efímero') RETURNING id", [nodoId])).rows[0].id;
    await db().query(
      "INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, 'Sensor efímero', 'corriente', 16, now())",
      [usuarioId],
    );

    await db().query("DELETE FROM sensores WHERE id = $1", [sensorId]);
    await db().query("DELETE FROM nodos WHERE id = $1", [nodoId]);

    const { rows } = await db().query("SELECT 1 FROM notificaciones WHERE usuario_id = $1 AND sensor_nombre = 'Sensor efímero'", [usuarioId]);
    expect(rows).toHaveLength(1);
  });

  it("#24 CA-1: eliminar el usuario elimina sus notificaciones", async () => {
    const id = (
      await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'h', 'tecnico') RETURNING id", [`${prefijo}-b`])
    ).rows[0].id;
    await db().query("INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, 's', 'potencia', 1, now())", [id]);
    await db().query("DELETE FROM usuarios WHERE id = $1", [id]);
    expect((await db().query("SELECT 1 FROM notificaciones WHERE usuario_id = $1", [id])).rowCount).toBe(0);
  });
});
