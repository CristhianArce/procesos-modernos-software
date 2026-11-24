import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { consultar as buscarHistorico } from "../repo";

const prefijo = `int-repo-historico-${randomUUID().slice(0, 8)}`;
const BASE = "2090-01-01T00:00:00.000Z";
const minuto = (m: number) => new Date(Date.parse(BASE) + m * 60_000).toISOString();
let nodoA: string;
let nodoB: string;
let sensorA1: string;
let sensorA2: string;
let sensorB1: string;

const insertar = async (sensorId: string, minutos: number[]) =>
  (
    await db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
       SELECT $1::uuid, 120, 1, 120, ($3::timestamptz + make_interval(mins => m)) FROM unnest($2::int[]) AS m RETURNING id`,
      [sensorId, minutos, BASE],
    )
  ).rows as { id: string }[];

beforeAll(async () => {
  nodoA = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-a`])).rows[0].id;
  nodoB = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-b`])).rows[0].id;
  sensorA1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a1') RETURNING id", [nodoA])).rows[0].id;
  sensorA2 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a2') RETURNING id", [nodoA])).rows[0].id;
  sensorB1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'b1') RETURNING id", [nodoB])).rows[0].id;
  // 26 lecturas en a1 (minutos 0..25), 3 en a2 (100, 101, 102) y 2 en b1 (200, 200 con la misma fecha).
  await insertar(sensorA1, Array.from({ length: 26 }, (_, i) => i));
  await insertar(sensorA2, [100, 101, 102]);
  await insertar(sensorB1, [200, 200]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

const base = { limite: 25, desplazamiento: 0 };

describe("repo del histórico", () => {
  it("#26 CA-1: la primera página trae 25 filas de la más reciente a la más antigua y el total", async () => {
    const { lecturas, total } = await buscarHistorico({ ...base, sensorId: sensorA1 });
    expect(total).toBe(26);
    expect(lecturas).toHaveLength(25);
    const fechas = lecturas.map((l) => Date.parse(l.tomadaEn));
    expect(fechas).toEqual([...fechas].sort((x, y) => y - x));
    expect(lecturas[0].tomadaEn).toBe(minuto(25));
  });

  it("#26 CA-1: la segunda página trae la única lectura restante, la más antigua", async () => {
    const { lecturas, total } = await buscarHistorico({ limite: 25, desplazamiento: 25, sensorId: sensorA1 });
    expect(total).toBe(26);
    expect(lecturas).toHaveLength(1);
    expect(lecturas[0].tomadaEn).toBe(minuto(0));
  });

  it("#26 CA-1: con la misma fecha va primero el identificador mayor", async () => {
    const { lecturas } = await buscarHistorico({ ...base, sensorId: sensorB1 });
    expect(lecturas).toHaveLength(2);
    expect(lecturas[0].id > lecturas[1].id).toBe(true);
  });

  it("#26 CA-2: filtra por nodo con el nombre del nodo y del sensor en la fila", async () => {
    const { lecturas, total } = await buscarHistorico({ ...base, nodoId: nodoB });
    expect(total).toBe(2);
    expect(lecturas.every((l) => l.nodoId === nodoB && l.sensorId === sensorB1)).toBe(true);
    expect(lecturas[0]).toMatchObject({ nodoNombre: `${prefijo}-b`, sensorNombre: "b1" });
  });

  it("#26 CA-2: filtra por sensor", async () => {
    const { lecturas, total } = await buscarHistorico({ ...base, sensorId: sensorA2 });
    expect(total).toBe(3);
    expect(lecturas.every((l) => l.sensorId === sensorA2)).toBe(true);
  });

  it("#26 CA-2: el rango de fechas incluye ambos extremos", async () => {
    const { lecturas, total } = await buscarHistorico({
      ...base,
      nodoId: nodoA,
      desde: minuto(100),
      hasta: minuto(102),
    });
    expect(total).toBe(3);
    expect(lecturas.map((l) => l.tomadaEn)).toEqual([minuto(102), minuto(101), minuto(100)]);
  });

  it("#26 CA-2: combina nodo, sensor y fechas", async () => {
    const { total } = await buscarHistorico({
      ...base,
      nodoId: nodoA,
      sensorId: sensorA1,
      desde: minuto(10),
      hasta: minuto(19),
    });
    expect(total).toBe(10);
    const ajeno = await buscarHistorico({ ...base, nodoId: nodoB, sensorId: sensorA1 });
    expect(ajeno.total).toBe(0);
  });

  it("#26 CA-3: un filtro sin coincidencias devuelve lista vacía y total 0", async () => {
    const { lecturas, total } = await buscarHistorico({ ...base, sensorId: sensorA2, desde: minuto(500) });
    expect(lecturas).toEqual([]);
    expect(total).toBe(0);
  });

  it("#26 CA-3: una página más allá de la última devuelve lista vacía con el total real", async () => {
    const { lecturas, total } = await buscarHistorico({ limite: 25, desplazamiento: 250, sensorId: sensorA1 });
    expect(lecturas).toEqual([]);
    expect(total).toBe(26);
  });

  it("#26 CA-3: un identificador inexistente devuelve lista vacía sin error", async () => {
    const sensor = await buscarHistorico({ ...base, sensorId: randomUUID() });
    const nodo = await buscarHistorico({ ...base, nodoId: randomUUID() });
    expect(sensor).toMatchObject({ lecturas: [], total: 0 });
    expect(nodo).toMatchObject({ lecturas: [], total: 0 });
  });
});
