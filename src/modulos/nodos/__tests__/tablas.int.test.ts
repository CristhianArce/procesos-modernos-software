import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const prefijo = `int-tablas-${randomUUID().slice(0, 8)}`;

const crearNodo = async () => {
  const { rows } = await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id, estado", [prefijo]);
  return rows[0] as { id: string; estado: string };
};

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("tablas nodos, sensores y lecturas", () => {
  it("#21 CA-1: un nodo nace con estado conectado", async () => {
    expect((await crearNodo()).estado).toBe("conectado");
  });

  it("#21 CA-1: el estado solo admite conectado y desconectado", async () => {
    const { id } = await crearNodo();
    await expect(db().query("UPDATE nodos SET estado = 'desconectado' WHERE id = $1", [id])).resolves.toBeDefined();
    await expect(db().query("UPDATE nodos SET estado = 'apagado' WHERE id = $1", [id])).rejects.toThrow(/check/i);
  });

  it("#21 CA-2: un sensor exige un nodo existente y umbrales mayores que 0", async () => {
    const { id } = await crearNodo();
    await expect(db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's')", [randomUUID()])).rejects.toThrow(/foreign key/i);
    await expect(db().query("INSERT INTO sensores (nodo_id, nombre, umbral_voltaje) VALUES ($1, 's', 0)", [id])).rejects.toThrow(/check/i);
    await expect(db().query("INSERT INTO sensores (nodo_id, nombre, umbral_potencia) VALUES ($1, 's', -5)", [id])).rejects.toThrow(/check/i);
    await expect(db().query("INSERT INTO sensores (nodo_id, nombre, umbral_corriente) VALUES ($1, 's', 15)", [id])).resolves.toBeDefined();
  });

  it("#21 CA-6: eliminar un nodo elimina sus sensores y sus lecturas", async () => {
    const { id } = await crearNodo();
    const sensor = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 's') RETURNING id", [id])).rows[0].id;
    await db().query("INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia) VALUES ($1, 120, 10, 1200)", [sensor]);

    await db().query("DELETE FROM nodos WHERE id = $1", [id]);

    expect((await db().query("SELECT 1 FROM sensores WHERE id = $1", [sensor])).rowCount).toBe(0);
    expect((await db().query("SELECT 1 FROM lecturas WHERE sensor_id = $1", [sensor])).rowCount).toBe(0);
  });
});
