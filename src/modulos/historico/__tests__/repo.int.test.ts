import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contar, listarPagina } from "../repo";

const prefijo = `int-historico-${randomUUID().slice(0, 8)}`;
let nodo1: string;
let nodo2: string;
let sensorA: string;
let sensorB: string;
let sensorC: string;

const filasPropias = async () =>
  Number((await db().query("SELECT count(*) AS n FROM lecturas WHERE sensor_id = ANY($1)", [[sensorA, sensorB, sensorC]])).rows[0].n);

beforeAll(async () => {
  await db().query("INSERT INTO nodos (nombre) VALUES ($1), ($2)", [`${prefijo} N1`, `${prefijo} N2`]);
  const nodos = (await db().query("SELECT id, nombre FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`])).rows;
  nodo1 = nodos.find((n) => n.nombre === `${prefijo} N1`).id;
  nodo2 = nodos.find((n) => n.nombre === `${prefijo} N2`).id;
  const sensores = (
    await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $3), ($1, $4), ($2, $5) RETURNING id, nombre", [
      nodo1,
      nodo2,
      `${prefijo} A`,
      `${prefijo} B`,
      `${prefijo} C`,
    ])
  ).rows;
  const id = (sufijo: string) => sensores.find((s) => s.nombre === `${prefijo} ${sufijo}`).id;
  [sensorA, sensorB, sensorC] = [id("A"), id("B"), id("C")];
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
     SELECT $1, 120 + n / 10.0, 5, 600, timestamptz '2026-02-10 08:00:00-05' + (n - 1) * interval '2 hours'
     FROM generate_series(1, 26) AS n`,
    [sensorA],
  );
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
     ($1, 119, 4, 476, '2026-02-11 09:00:00-05'), ($1, 119, 4, 476, '2026-02-11 10:00:00-05'),
     ($2, 121, 5, 605, '2026-02-09 23:30:00-05'), ($2, 121, 5, 605, '2026-02-13 00:30:00-05'),
     ($3, 118, 3, 354, '2026-02-11 12:00:00-05')`,
    [sensorB, sensorA, sensorC],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo del histórico", () => {
  it("#26 CA-1: listarPagina devuelve 25 por página, de la más reciente a la más antigua, con nombres", async () => {
    const filas = await listarPagina({ nodoId: nodo1, sensorId: sensorA, desde: "2026-02-10", hasta: "2026-02-12" }, 1);
    expect(filas).toHaveLength(25);
    const tiempos = filas.map((f) => new Date(f.tomadaEn).getTime());
    expect([...tiempos].sort((a, b) => b - a)).toEqual(tiempos);
    expect(new Date(filas[0].tomadaEn).toISOString()).toBe(new Date("2026-02-12T10:00:00-05:00").toISOString());
    expect(filas[0]).toMatchObject({ nodoId: nodo1, nodoNombre: `${prefijo} N1`, sensorId: sensorA, sensorNombre: `${prefijo} A` });
    expect(typeof filas[0].voltaje).toBe("number");
  });

  it("#26 CA-1: la página 2 trae el resto y la 3 queda vacía", async () => {
    const filtros = { nodoId: nodo1, sensorId: sensorA, desde: "2026-02-10", hasta: "2026-02-12" };
    const pagina2 = await listarPagina(filtros, 2);
    expect(pagina2).toHaveLength(1);
    expect(new Date(pagina2[0].tomadaEn).toISOString()).toBe(new Date("2026-02-10T08:00:00-05:00").toISOString());
    expect(await listarPagina(filtros, 3)).toEqual([]);
  });

  it("#26 CA-1: contar coincide con el total del filtro", async () => {
    expect(await contar({ nodoId: nodo1, sensorId: sensorA, desde: "2026-02-10", hasta: "2026-02-12" })).toBe(26);
    expect(await contar({ nodoId: nodo1 })).toBe(30);
  });

  it("#26 CA-2: el filtro por nodo y por sensor se combina", async () => {
    const soloB = await listarPagina({ nodoId: nodo1, sensorId: sensorB }, 1);
    expect(soloB).toHaveLength(2);
    expect(soloB.every((f) => f.sensorId === sensorB)).toBe(true);
    const soloNodo2 = await listarPagina({ nodoId: nodo2 }, 1);
    expect(soloNodo2.map((f) => f.sensorId)).toEqual([sensorC]);
  });

  it("#26 CA-2: la lectura de las 23:30 de Bogotá del día anterior queda fuera y la de las 00:30 del día siguiente también", async () => {
    const filas = await listarPagina({ sensorId: sensorA, desde: "2026-02-10", hasta: "2026-02-12" }, 1);
    expect(filas.length).toBeGreaterThan(0);
    const limites = filas.map((f) => new Date(f.tomadaEn).getTime());
    expect(Math.min(...limites)).toBeGreaterThanOrEqual(new Date("2026-02-10T00:00:00-05:00").getTime());
    expect(Math.max(...limites)).toBeLessThan(new Date("2026-02-13T00:00:00-05:00").getTime());
    expect(await contar({ sensorId: sensorA, desde: "2026-02-10", hasta: "2026-02-12" })).toBe(26);
  });

  it("#26 CA-2: desde igual a hasta trae solo ese día", async () => {
    const filas = await listarPagina({ sensorId: sensorA, desde: "2026-02-11", hasta: "2026-02-11" }, 1);
    expect(filas.length).toBeGreaterThan(0);
    for (const f of filas) {
      const t = new Date(f.tomadaEn).getTime();
      expect(t).toBeGreaterThanOrEqual(new Date("2026-02-11T00:00:00-05:00").getTime());
      expect(t).toBeLessThan(new Date("2026-02-12T00:00:00-05:00").getTime());
    }
    expect(await contar({ sensorId: sensorA, desde: "2026-02-11", hasta: "2026-02-11" })).toBe(filas.length);
  });

  it("#26 CA-3: un sensor de otro nodo, un rango sin lecturas y ids inexistentes dan vacío", async () => {
    expect(await listarPagina({ nodoId: nodo2, sensorId: sensorA }, 1)).toEqual([]);
    expect(await contar({ nodoId: nodo2, sensorId: sensorA })).toBe(0);
    expect(await listarPagina({ nodoId: nodo1, desde: "2001-01-01", hasta: "2001-01-02" }, 1)).toEqual([]);
    expect(await contar({ nodoId: randomUUID() })).toBe(0);
    expect(await contar({ sensorId: randomUUID() })).toBe(0);
  });

  it("#26 CA-1: consultar no cambia el número de filas de lecturas", async () => {
    const antes = await filasPropias();
    await listarPagina({ nodoId: nodo1 }, 1);
    await contar({ nodoId: nodo1 });
    expect(await filasPropias()).toBe(antes);
    expect(antes).toBe(31);
  });
});
