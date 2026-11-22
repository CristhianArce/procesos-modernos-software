import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { insertar, ultimasPorSensor } from "../repo";

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
});
