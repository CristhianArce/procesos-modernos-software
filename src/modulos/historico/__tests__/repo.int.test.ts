import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { contar, listar } from "../repo";

const prefijo = `int-repo-historico-${randomUUID().slice(0, 8)}`;
const BASE = "2020-01-01T00:00:00Z";
let nodoA: string;
let nodoB: string;
let sensorA1: string;
let sensorA2: string;
let sensorB1: string;

/** Instante `BASE` más `minuto` minutos, en ISO UTC. */
const en = (minuto: number) => new Date(Date.parse(BASE) + minuto * 60_000).toISOString();

const insertarLecturas = async (sensorId: string, minutos: number[]) =>
  (
    await db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
       SELECT $1::uuid, 120 + m, 2, 240, $3::timestamptz + make_interval(mins => m) FROM unnest($2::int[]) AS m
       RETURNING id, voltaje`,
      [sensorId, minutos, BASE],
    )
  ).rows as { id: string; voltaje: number }[];

beforeAll(async () => {
  nodoA = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-A`])).rows[0].id;
  nodoB = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-B`])).rows[0].id;
  sensorA1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a1') RETURNING id", [nodoA])).rows[0].id;
  sensorA2 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a2') RETURNING id", [nodoA])).rows[0].id;
  sensorB1 = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'b1') RETURNING id", [nodoB])).rows[0].id;
  // Nodo A: 26 lecturas (24 del sensor a1 en los minutos 0..23 y 2 del a2 en 24 y 25). Nodo B: 3 lecturas en 10, 11 y 12.
  await insertarLecturas(sensorA1, Array.from({ length: 24 }, (_, i) => i));
  await insertarLecturas(sensorA2, [24, 25]);
  await insertarLecturas(sensorB1, [10, 11, 12]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}-%`]);
  await db().end();
});

describe("repo del histórico", () => {
  it("#26 CA-1: listar ordena por fecha descendente, trae como mucho 25 filas y la página 2 trae el resto sin repetir", async () => {
    const p1 = await listar({ nodoId: nodoA, pagina: 1 });
    const p2 = await listar({ nodoId: nodoA, pagina: 2 });

    expect(p1).toHaveLength(25);
    expect(p1[0].tomadaEn).toBe(en(25));
    expect(p1.map((l) => Date.parse(l.tomadaEn))).toEqual([...p1.map((l) => Date.parse(l.tomadaEn))].sort((a, b) => b - a));
    expect(p2).toHaveLength(1);
    expect(p2[0].tomadaEn).toBe(en(0));
    expect(new Set([...p1, ...p2].map((l) => l.id)).size).toBe(26);
  });

  it("#26 CA-1: a igual fecha desempata por identificador descendente", async () => {
    const empate = "2020-06-01T00:00:00Z";
    const { rows } = await db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
       VALUES ($1, 1, 1, 1, $2), ($1, 2, 2, 2, $2), ($1, 3, 3, 3, $2) RETURNING id`,
      [sensorB1, empate],
    );
    const esperado = rows.map((f) => f.id as string).sort().reverse();

    const filas = await listar({ sensorId: sensorB1, desde: empate, hasta: empate, pagina: 1 });

    expect(filas.map((l) => l.id)).toEqual(esperado);
  });

  it("#26 CA-1: cada fila trae sensorNombre, nodoId, nodoNombre y las tres magnitudes", async () => {
    const [fila] = await listar({ sensorId: sensorA2, pagina: 1 });

    expect(fila).toMatchObject({
      sensorId: sensorA2,
      sensorNombre: "a2",
      nodoId: nodoA,
      nodoNombre: `${prefijo}-A`,
      corriente: 2,
      potencia: 240,
    });
    expect(fila.tomadaEn).toBe(en(25));
  });

  it("#26 CA-2: filtra por nodo", async () => {
    const filas = await listar({ nodoId: nodoB, pagina: 1 });
    expect(filas.filter((l) => l.nodoId === nodoB).length).toBeGreaterThanOrEqual(3);
    expect(filas.every((l) => l.nodoId === nodoB)).toBe(true);
  });

  it("#26 CA-2: filtra por sensor", async () => {
    const filas = await listar({ sensorId: sensorA2, pagina: 1 });
    expect(filas).toHaveLength(2);
    expect(filas.every((l) => l.sensorId === sensorA2)).toBe(true);
  });

  it("#26 CA-2: el rango incluye ambos extremos y deja fuera lo de afuera", async () => {
    const filas = await listar({ nodoId: nodoA, desde: en(5), hasta: en(8), pagina: 1 });
    expect(filas.map((l) => l.tomadaEn)).toEqual([en(8), en(7), en(6), en(5)]);
  });

  it("#26 CA-2: combina nodo, sensor y rango con AND", async () => {
    const filas = await listar({ nodoId: nodoA, sensorId: sensorA1, desde: en(20), hasta: en(25), pagina: 1 });
    expect(filas.map((l) => l.tomadaEn)).toEqual([en(23), en(22), en(21), en(20)]);
  });

  it("#26 CA-2: contar coincide con los mismos filtros", async () => {
    expect(await contar({ nodoId: nodoA })).toBe(26);
    expect(await contar({ sensorId: sensorA2 })).toBe(2);
    expect(await contar({ nodoId: nodoA, desde: en(5), hasta: en(8) })).toBe(4);
    expect(await contar({ nodoId: nodoA, sensorId: sensorA1, desde: en(20), hasta: en(25) })).toBe(4);
  });

  it("#26 CA-3: un sensor de otro nodo da lista vacía y total 0", async () => {
    expect(await listar({ nodoId: nodoA, sensorId: sensorB1, pagina: 1 })).toEqual([]);
    expect(await contar({ nodoId: nodoA, sensorId: sensorB1 })).toBe(0);
  });

  it("#26 CA-3: un rango sin lecturas da lista vacía y total 0", async () => {
    const filtros = { nodoId: nodoA, desde: "2019-01-01T00:00:00Z", hasta: "2019-01-02T00:00:00Z" };
    expect(await listar({ ...filtros, pagina: 1 })).toEqual([]);
    expect(await contar(filtros)).toBe(0);
  });

  it("#26 CA-3: una página más allá del final da lista vacía", async () => {
    expect(await listar({ nodoId: nodoA, pagina: 3 })).toEqual([]);
  });

  it("#26 CA-1: consultar no modifica lecturas, sensores ni nodos", async () => {
    const cuenta = async () =>
      (
        await db().query(
          `SELECT (SELECT count(*) FROM lecturas l JOIN sensores s ON s.id = l.sensor_id WHERE s.nodo_id = ANY($1::uuid[]))::int AS lecturas,
                  (SELECT count(*) FROM sensores WHERE nodo_id = ANY($1::uuid[]))::int AS sensores,
                  (SELECT count(*) FROM nodos WHERE id = ANY($1::uuid[]))::int AS nodos`,
          [[nodoA, nodoB]],
        )
      ).rows[0];
    const antes = await cuenta();

    await listar({ nodoId: nodoA, pagina: 1 });
    await contar({ nodoId: nodoA });

    expect(await cuenta()).toEqual(antes);
  });
});
