import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tabla-notif-${randomUUID().slice(0, 8)}`;
let usuarioId: string;

beforeAll(async () => {
  usuarioId = (
    await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'x', 'tecnico') RETURNING id", [prefijo])
  ).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario = $1", [prefijo]);
  await db().end();
});

describe("tabla notificaciones", () => {
  it("#24 CA-1: la tabla guarda sensor, magnitud, valor, fecha y leída, sin umbral ni nodo", async () => {
    const { rows } = await db().query(
      `INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en)
       VALUES ($1, 'Sensor X', 'voltaje', 130, now()) RETURNING *`,
      [usuarioId],
    );
    expect(rows[0]).toMatchObject({ usuario_id: usuarioId, sensor_nombre: "Sensor X", magnitud: "voltaje", valor: 130, leida: false });
    expect(rows[0].alerta_creada_en).toBeInstanceOf(Date);

    const columnas = (
      await db().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'notificaciones'")
    ).rows.map((f) => f.column_name);
    expect(columnas).toEqual(expect.arrayContaining(["sensor_nombre", "magnitud", "valor", "alerta_creada_en", "leida"]));
    expect(columnas).not.toContain("umbral");
    expect(columnas).not.toContain("nodo_id");
  });

  it("#24 CA-1: rechaza una magnitud desconocida", async () => {
    await expect(
      db().query(
        "INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, 's', 'frecuencia', 1, now())",
        [usuarioId],
      ),
    ).rejects.toThrow();
  });

  it("#24 CA-1: la notificación sobrevive a la eliminación del sensor", async () => {
    const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
    try {
      const nombreSensor = `${prefijo}-sensor`;
      const sensorId = (
        await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $2) RETURNING id", [nodoId, nombreSensor])
      ).rows[0].id;
      await db().query(
        "INSERT INTO notificaciones (usuario_id, sensor_nombre, magnitud, valor, alerta_creada_en) VALUES ($1, $2, 'corriente', 9, now())",
        [usuarioId, nombreSensor],
      );

      await db().query("DELETE FROM sensores WHERE id = $1", [sensorId]);

      const { rows } = await db().query("SELECT sensor_nombre FROM notificaciones WHERE usuario_id = $1 AND sensor_nombre = $2", [
        usuarioId,
        nombreSensor,
      ]);
      expect(rows).toEqual([{ sensor_nombre: nombreSensor }]);
    } finally {
      await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
    }
  });
});
