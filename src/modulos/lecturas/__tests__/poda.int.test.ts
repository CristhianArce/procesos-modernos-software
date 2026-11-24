import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { podar } from "../repo";

const prefijo = `int-poda-${randomUUID().slice(0, 8)}`;
let reciente: string;
let viejo: string;

beforeAll(async () => {
  const nodoId = (await db().query("INSERT INTO nodos (nombre) VALUES ($1) RETURNING id", [prefijo])).rows[0].id;
  [reciente, viejo] = (await db().query("INSERT INTO sensores (nodo_id, nombre) VALUES ($1, 'r'), ($1, 'v') RETURNING id", [nodoId])).rows.map((f) => f.id);
  await db().query(
    `INSERT INTO lecturas (sensor_id, voltaje, corriente, potencia, tomada_en) VALUES
       ($1, 1, 1, 1, now() - interval '3 hours'), ($1, 2, 1, 2, now() - interval '2 hours'), ($1, 3, 1, 3, now() - interval '1 minute'),
       ($2, 4, 1, 4, now() - interval '5 hours'), ($2, 5, 1, 5, now() - interval '4 hours')`,
    [reciente, viejo],
  );
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

const voltajes = async (sensorId: string) =>
  (await db().query("SELECT voltaje FROM lecturas WHERE sensor_id = $1 ORDER BY tomada_en", [sensorId])).rows.map((f) => f.voltaje);

describe("poda de lecturas", () => {
  it("ui-scada: borra las lecturas más antiguas que la retención y conserva la última de cada sensor aunque sea vieja", async () => {
    expect(await podar(60)).toBeGreaterThanOrEqual(3);
    expect(await voltajes(reciente)).toEqual([3]);
    expect(await voltajes(viejo)).toEqual([5]);
  });
});
