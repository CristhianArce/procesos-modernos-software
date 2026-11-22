import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { insertar, recientes } from "../repo";

const prefijo = `int-repo-alertas-${randomUUID().slice(0, 8)}`;
let a: string;
let b: string;

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  [a, b] = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'a'), ($1, 'b') RETURNING id", [nodoId])).rows.map((f) => f.id);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("repo de alertas", () => {
  it("#22 CA-3: inserta varias alertas en una llamada y las devuelve con id y fecha", async () => {
    const alertas = await insertar([
      { sensorId: a, magnitud: "voltaje", valor: 130, umbral: 125 },
      { sensorId: a, magnitud: "corriente", valor: 16, umbral: 15 },
    ]);
    expect(alertas).toHaveLength(2);
    expect(alertas).toContainEqual(expect.objectContaining({ sensorId: a, magnitud: "corriente", valor: 16, umbral: 15 }));
    expect(alertas[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(alertas[0].creadaEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("#22 CA-4: recientes devuelve de la más reciente a la más antigua, respeta el límite y filtra por sensor", async () => {
    const { rows } = await db().query(
      `INSERT INTO alertas (sensor_id, magnitud, valor, umbral, creada_en) VALUES
         ($1, 'voltaje', 126, 125, now() + interval '1 hour'),
         ($1, 'voltaje', 127, 125, now() + interval '3 hour'),
         ($1, 'voltaje', 128, 125, now() + interval '2 hour'),
         ($2, 'potencia', 2000, 1800, now() + interval '4 hour')
       RETURNING id, valor`,
      [b, a],
    );
    const id = (valor: number) => rows.find((f) => f.valor === valor).id;

    expect((await recientes({ sensorId: b, limite: 10 })).map((x) => x.id)).toEqual([id(127), id(128), id(126)]);
    expect((await recientes({ sensorId: b, limite: 2 })).map((x) => x.id)).toEqual([id(127), id(128)]);
    expect((await recientes({ limite: 1 }))[0].id).toBe(id(2000));
  });
});
