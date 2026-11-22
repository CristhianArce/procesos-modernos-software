import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { insertar, recientes, recientesPorSensor, ultimasPorSensor } from "../repo";

const prefijo = `int-repo-lecturas-${randomUUID().slice(0, 8)}`;
let sensores: string[];

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  const { rows } = await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a'), ($1, 'b'), ($1, 'c') RETURNING id", [nodoId]);
  sensores = rows.map((f) => f.id);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("repo de lecturas", () => {
  it("#21 CA-6: inserta varias lecturas en una llamada, con las tres magnitudes", async () => {
    const [a, b] = sensores;
    const lecturas = await insertar([
      { sensorId: a, voltaje: 120.5, corriente: 10, potencia: 1205 },
      { sensorId: b, voltaje: 118, corriente: 5.5, potencia: 649 },
    ]);
    expect(lecturas).toHaveLength(2);
    expect(lecturas.find((l) => l.sensorId === a)).toMatchObject({ voltaje: 120.5, corriente: 10, potencia: 1205 });
    expect(lecturas.find((l) => l.sensorId === b)).toMatchObject({ voltaje: 118, corriente: 5.5, potencia: 649 });
    expect(lecturas[0].tomadaEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("#21 CA-6: la última lectura de un sensor es la más reciente y un sensor sin lecturas no aparece", async () => {
    const [a, , sinLecturas] = sensores;
    await insertar([{ sensorId: a, voltaje: 111, corriente: 1, potencia: 111 }]);
    const [reciente] = await insertar([{ sensorId: a, voltaje: 129, corriente: 2, potencia: 258 }]);

    const ultimas = await ultimasPorSensor([a, sinLecturas]);

    expect(ultimas).toEqual([reciente]);
  });

  // Lecturas con fechas fijas en el futuro, para que el orden no dependa de las demás pruebas.
  const conFechas = async (sensorId: string, horas: number[]) =>
    (
      await db().query(
        `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en)
         SELECT $1::uuid, h, 1, h, now() + make_interval(hours => h) FROM unnest($2::int[]) AS h RETURNING id, voltaje`,
        [sensorId, horas],
      )
    ).rows as { id: string; voltaje: number }[];

  it("#22 CA-6: recientes va de la más reciente a la más antigua, respeta el límite y filtra por sensor", async () => {
    const [, b] = sensores;
    const filas = await conFechas(b, [101, 103, 102]);
    const id = (h: number) => filas.find((f) => f.voltaje === h)!.id;

    expect((await recientes({ sensorId: b, limite: 2 })).map((l) => l.id)).toEqual([id(103), id(102)]);
    expect((await recientes({ limite: 1 }))[0].id).toBe(id(103));
  });

  it("#22 CA-2: recientesPorSensor trae como mucho el límite por sensor, las más recientes, en orden ascendente", async () => {
    const [, , c] = sensores;
    const filas = await conFechas(c, [201, 204, 202, 203]);
    const id = (h: number) => filas.find((f) => f.voltaje === h)!.id;

    const serie = (await recientesPorSensor([c], 3)).map((l) => l.id);

    expect(serie).toEqual([id(202), id(203), id(204)]);
  });
});
