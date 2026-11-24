import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { consultar, contar } from "../repo";

const prefijo = `int-repo-historico-${randomUUID().slice(0, 8)}`;
// Fechas fijas en 2001, lejos de las lecturas del simulador, y siempre acotadas por sensor o nodo propios.
const BASE = "2001-01-01T00:00:00.000Z";
let nodoA: string;
let nodoB: string;
let sensorLleno: string; // 26 lecturas
let sensorA2: string; // 3 lecturas
let sensorB: string; // 2 lecturas
let sensorVacio: string;

const insertar = async (sensorId: string, minutos: number[]) =>
  (
    await db().query(
      `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
       SELECT $1::uuid, 120, 1, 120, $2::timestamptz + make_interval(mins => m) FROM unnest($3::int[]) AS m
       RETURNING id, tomada_en`,
      [sensorId, BASE, minutos],
    )
  ).rows as { id: string; tomada_en: Date }[];

const instante = (minutos: number) => new Date(new Date(BASE).getTime() + minutos * 60_000).toISOString();

beforeAll(async () => {
  nodoA = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-a`])).rows[0].id;
  nodoB = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [`${prefijo}-b`])).rows[0].id;
  const crear = async (nodoId: string, nombre: string) =>
    (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, $2) RETURNING id", [nodoId, nombre])).rows[0].id as string;
  sensorLleno = await crear(nodoA, "lleno");
  sensorA2 = await crear(nodoA, "a2");
  sensorB = await crear(nodoB, "b");
  sensorVacio = await crear(nodoB, "vacio");
  await insertar(sensorLleno, Array.from({ length: 26 }, (_, i) => i));
  await insertar(sensorA2, [100, 101, 102]);
  await insertar(sensorB, [101, 200]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo del histórico", () => {
  it("#26 CA-1: la página 1 trae 25 lecturas de la más reciente a la más antigua y la 2 trae la más antigua", async () => {
    const pagina1 = await consultar({ sensorId: sensorLleno, pagina: 1 });
    expect(pagina1).toHaveLength(25);
    expect(pagina1[0].tomadaEn).toBe(instante(25));
    expect(pagina1[24].tomadaEn).toBe(instante(1));
    const fechas = pagina1.map((f) => f.tomadaEn);
    expect([...fechas].sort().reverse()).toEqual(fechas);

    const pagina2 = await consultar({ sensorId: sensorLleno, pagina: 2 });
    expect(pagina2).toHaveLength(1);
    expect(pagina2[0].tomadaEn).toBe(instante(0));
  });

  it("#26 CA-1: cada fila trae los nombres del sensor y del nodo y las tres magnitudes", async () => {
    const [fila] = await consultar({ sensorId: sensorA2, pagina: 1 });
    expect(fila).toMatchObject({
      sensorId: sensorA2,
      sensorNombre: "a2",
      nodoId: nodoA,
      nodoNombre: `${prefijo}-a`,
      voltaje: 120,
      corriente: 1,
      potencia: 120,
    });
  });

  it("#26 CA-1: las lecturas con la misma fecha se ordenan por identificador descendente", async () => {
    const filas = await insertar(sensorA2, [500, 500, 500]);
    const esperado = filas.map((f) => f.id).sort().reverse();

    const resultado = await consultar({ sensorId: sensorA2, desde: instante(500), hasta: instante(501), pagina: 1 });

    expect(resultado.map((f) => f.id)).toEqual(esperado);
  });

  it("#26 CA-1: contar devuelve el total de las lecturas del sensor (26)", async () => {
    expect(await contar({ sensorId: sensorLleno, pagina: 1 })).toBe(26);
  });

  it("#26 CA-2: filtra por nodo", async () => {
    const filas = await consultar({ nodoId: nodoB, desde: instante(0), hasta: instante(1000), pagina: 1 });
    expect(filas).toHaveLength(2);
    expect(new Set(filas.map((f) => f.nodoId))).toEqual(new Set([nodoB]));
    expect(await contar({ nodoId: nodoB, pagina: 1 })).toBe(2);
  });

  it("#26 CA-2: filtra por sensor", async () => {
    const filas = await consultar({ sensorId: sensorB, pagina: 1 });
    expect(filas.map((f) => f.tomadaEn)).toEqual([instante(200), instante(101)]);
    expect(new Set(filas.map((f) => f.sensorId))).toEqual(new Set([sensorB]));
  });

  it("#26 CA-2: combina nodo, sensor y rango de fechas", async () => {
    const filtros = { nodoId: nodoA, sensorId: sensorA2, desde: instante(101), hasta: instante(102), pagina: 1 };
    const filas = await consultar(filtros);
    expect(filas.map((f) => f.tomadaEn)).toEqual([instante(101)]);
    expect(await contar(filtros)).toBe(1);
  });

  it("#26 CA-2: un sensor que no es del nodo indicado no devuelve nada", async () => {
    expect(await consultar({ nodoId: nodoB, sensorId: sensorLleno, pagina: 1 })).toEqual([]);
  });

  it("#26 CA-2: el rango incluye la fecha desde y excluye la fecha hasta", async () => {
    const filtros = { sensorId: sensorA2, desde: instante(100), hasta: instante(102), pagina: 1 };
    const filas = await consultar(filtros);
    expect(filas.map((f) => f.tomadaEn)).toEqual([instante(101), instante(100)]);
    expect(await contar(filtros)).toBe(2);
  });

  it("#26 CA-3: un sensor sin lecturas devuelve lista vacía y total 0", async () => {
    expect(await consultar({ sensorId: sensorVacio, pagina: 1 })).toEqual([]);
    expect(await contar({ sensorId: sensorVacio, pagina: 1 })).toBe(0);
  });

  it("#26 CA-3: un identificador inexistente no es error: lista vacía y total 0", async () => {
    const sensorId = randomUUID();
    expect(await consultar({ sensorId, pagina: 1 })).toEqual([]);
    expect(await contar({ sensorId, pagina: 1 })).toBe(0);
  });
});
