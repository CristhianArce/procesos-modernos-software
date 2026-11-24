import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listarParaExportar } from "../repo";

const prefijo = `int-exportar-${randomUUID().slice(0, 8)}`;
let nodo1: string;
let nodo2: string;
let sensorA: string;
let sensorB: string;
let sensorC: string;

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
     SELECT $1, 120 + n / 10.0, 5, 600, timestamptz '2026-04-10 08:00:00-05' + (n - 1) * interval '2 hours'
     FROM generate_series(1, 26) AS n`,
    [sensorA],
  );
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
     ($1, 119, 4, 476, '2026-04-11 09:00:00-05'), ($1, 119, 4, 476, '2026-04-11 10:00:00-05'),
     ($2, 121, 5, 605, '2026-04-09 23:30:00-05'), ($2, 121, 5, 605, '2026-04-13 00:30:00-05'),
     ($3, 118, 3, 354, '2026-04-11 12:00:00-05')`,
    [sensorB, sensorA, sensorC],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

const instante = (iso: Date | string) => new Date(iso).toISOString();

describe("repo de exportación del histórico", () => {
  it("#56 CA-1: listarParaExportar devuelve las lecturas del filtro, de la más reciente a la más antigua, con nombres", async () => {
    const filas = await listarParaExportar({ nodoId: nodo1, sensorId: sensorA, desde: "2026-04-10", hasta: "2026-04-12" }, 10_000);
    expect(filas).toHaveLength(26);
    const tiempos = filas.map((f) => new Date(f.tomadaEn).getTime());
    expect([...tiempos].sort((a, b) => b - a)).toEqual(tiempos);
    expect(instante(filas[0].tomadaEn)).toBe(instante("2026-04-12T10:00:00-05:00"));
    expect(instante(filas[25].tomadaEn)).toBe(instante("2026-04-10T08:00:00-05:00"));
    expect(filas[0]).toMatchObject({ nodoNombre: `${prefijo} N1`, sensorNombre: `${prefijo} A` });
    expect(typeof filas[0].voltaje).toBe("number");
  });

  it("#56 CA-1: los bordes del día se interpretan en Bogotá, igual que en la HU 9", async () => {
    const unDia = await listarParaExportar({ sensorId: sensorA, desde: "2026-04-11", hasta: "2026-04-11" }, 10_000);
    expect(unDia).toHaveLength(12);
    const soloB = await listarParaExportar({ nodoId: nodo1, sensorId: sensorB }, 10_000);
    expect(soloB).toHaveLength(2);
  });

  it("#56 CA-1: el nodo filtra y un sensor de otro nodo no coincide", async () => {
    const delNodo2 = await listarParaExportar({ nodoId: nodo2 }, 10_000);
    expect(delNodo2).toHaveLength(1);
    expect(delNodo2[0]).toMatchObject({ nodoNombre: `${prefijo} N2`, sensorNombre: `${prefijo} C` });
    expect(await listarParaExportar({ nodoId: nodo2, sensorId: sensorA }, 10_000)).toEqual([]);
  });

  it("#56 CA-2: un filtro sin coincidencias devuelve []", async () => {
    expect(await listarParaExportar({ nodoId: nodo1, desde: "2001-01-01", hasta: "2001-01-02" }, 10_000)).toEqual([]);
    expect(await listarParaExportar({ sensorId: randomUUID() }, 10_000)).toEqual([]);
  });

  it("#56 CA-1: con tope menor que las coincidencias devuelve solo las más recientes", async () => {
    const filas = await listarParaExportar({ nodoId: nodo1, sensorId: sensorA, desde: "2026-04-10", hasta: "2026-04-12" }, 5);
    expect(filas).toHaveLength(5);
    expect(instante(filas[0].tomadaEn)).toBe(instante("2026-04-12T10:00:00-05:00"));
    expect(instante(filas[4].tomadaEn)).toBe(instante("2026-04-12T02:00:00-05:00"));
  });
});
