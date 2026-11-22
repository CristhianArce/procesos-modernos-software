import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tabla-alertas-${randomUUID().slice(0, 8)}`;
let sensorId: string;

const insertar = (sensor: string | null, magnitud = "voltaje") =>
  db().query("INSERT INTO alertas (sensor_id, magnitud, valor, umbral) VALUES ($1, $2, 130, 125) RETURNING *", [sensor, magnitud]);

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  sensorId = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's') RETURNING id", [nodoId])).rows[0].id;
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("tabla alertas", () => {
  it("#22 CA-3: guarda sensor, magnitud, valor, umbral y la fecha de registro por defecto", async () => {
    const { rows } = await insertar(sensorId);
    expect(rows[0]).toMatchObject({ sensor_id: sensorId, magnitud: "voltaje", valor: 130, umbral: 125 });
    expect(rows[0].creada_en).toBeInstanceOf(Date);
  });

  it("#22 CA-3: rechaza una magnitud desconocida y una alerta sin sensor", async () => {
    await expect(insertar(sensorId, "frecuencia")).rejects.toThrow();
    await expect(insertar(null)).rejects.toThrow();
  });

  it("#22 CA-3: eliminar el sensor elimina sus alertas", async () => {
    const nodoId = (await db().query("SELECT nodo_id FROM sensores WHERE id = $1", [sensorId])).rows[0].nodo_id;
    const otro = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'otro') RETURNING id", [nodoId])).rows[0].id;
    await insertar(otro);
    await db().query("DELETE FROM sensores WHERE id = $1", [otro]);
    expect((await db().query("SELECT 1 FROM alertas WHERE sensor_id = $1", [otro])).rowCount).toBe(0);
  });
});
