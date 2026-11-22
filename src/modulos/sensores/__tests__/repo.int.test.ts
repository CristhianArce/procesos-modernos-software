import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { actualizar, buscar, crear, eliminar, listarPorNodo } from "../repo";

const prefijo = `int-repo-sensores-${randomUUID().slice(0, 8)}`;
let nodoId: string;
let otroNodoId: string;

const crearNodo = async (nombre: string) => (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [nombre])).rows[0].id as string;

beforeAll(async () => {
  nodoId = await crearNodo(`${prefijo}-a`);
  otroNodoId = await crearNodo(`${prefijo}-b`);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de sensores", () => {
  it("#21 CA-2: crear asocia el sensor al nodo con sus umbrales", async () => {
    const sensor = await crear({ nodoId, nombre: "S1", umbralVoltaje: 125, umbralCorriente: 15.5 });
    expect(sensor).toMatchObject({ nodoId, nombre: "S1", umbralVoltaje: 125, umbralCorriente: 15.5, umbralPotencia: null });
  });

  it("#21 CA-2: listar por nodo devuelve solo los sensores de ese nodo", async () => {
    const propio = await crear({ nodoId, nombre: "S2" });
    const ajeno = await crear({ nodoId: otroNodoId, nombre: "S3" });
    const sensores = await listarPorNodo(nodoId);
    expect(sensores).toContainEqual(propio);
    expect(sensores.map((s) => s.id)).not.toContain(ajeno.id);
  });

  it("#21 CA-4: buscar devuelve el sensor, o null si no existe", async () => {
    const sensor = await crear({ nodoId, nombre: "S4" });
    expect(await buscar(sensor.id)).toEqual(sensor);
    expect(await buscar(randomUUID())).toBeNull();
  });

  it("#21 CA-4: actualizar cambia solo los campos enviados y quita un umbral con null", async () => {
    const sensor = await crear({ nodoId, nombre: "S5", umbralVoltaje: 125, umbralPotencia: 1800 });
    expect(await actualizar(sensor.id, { nombre: "S5b", umbralVoltaje: null })).toMatchObject({
      nodoId,
      nombre: "S5b",
      umbralVoltaje: null,
      umbralPotencia: 1800,
    });
    expect(await actualizar(randomUUID(), { nombre: "x" })).toBeNull();
  });

  it("#21 CA-4: eliminar devuelve si el sensor existía", async () => {
    const sensor = await crear({ nodoId, nombre: "S6" });
    expect(await eliminar(sensor.id)).toBe(true);
    expect(await eliminar(sensor.id)).toBe(false);
  });
});
