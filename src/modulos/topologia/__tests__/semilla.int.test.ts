import { readdirSync, readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: topologia.sql va después de nodos.sql y sensores.sql.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const aplicar = async () => {
  for (const f of archivos) await db().query(readFileSync(`db/seed/${f}`, "utf8"));
};
const DE_LA_RED = "00000000-0000-4000-9000-%";
const uno = async (sql: string, p: unknown[] = []) => (await db().query(sql, p)).rows[0];

afterAll(() => db().end());

describe("semilla de la topología", () => {
  it("ui-scada: se aplica después de las semillas de nodos y sensores", () => {
    expect(archivos.indexOf("topologia.sql")).toBeGreaterThan(archivos.indexOf("sensores.sql"));
  });

  it("ui-scada: se puede aplicar dos veces sin duplicar nada", async () => {
    await aplicar();
    const contar = () =>
      uno(`SELECT (SELECT count(*) FROM nodos WHERE id::text LIKE $1)::int AS nodos,
                  (SELECT count(*) FROM nodo_topologia)::int AS posiciones,
                  (SELECT count(*) FROM enlaces WHERE id::text LIKE $1)::int AS enlaces,
                  (SELECT count(*) FROM lecturas l JOIN sensores s ON s.id = l.sensor_id WHERE s.id::text LIKE $1)::int AS lecturas`, [DE_LA_RED]);
    const antes = await contar();
    await aplicar();
    expect(await contar()).toEqual(antes);
  });

  it("ui-scada: la red tiene 12 nodos o más ubicados, unidos por enlaces entre nodos ubicados", async () => {
    await aplicar();
    const { ubicados } = await uno(
      "SELECT count(*)::int AS ubicados FROM nodo_topologia WHERE nodo_id::text LIKE '00000000-0000-4000-8000-%' OR nodo_id::text LIKE $1",
      [DE_LA_RED],
    );
    expect(ubicados).toBeGreaterThanOrEqual(12);
    const { sueltos } = await uno(
      `SELECT count(*)::int AS sueltos FROM enlaces e WHERE e.id::text LIKE $1 AND (
         NOT EXISTS (SELECT 1 FROM nodo_topologia t WHERE t.nodo_id = e.origen_id) OR
         NOT EXISTS (SELECT 1 FROM nodo_topologia t WHERE t.nodo_id = e.destino_id))`,
      [DE_LA_RED],
    );
    expect(sueltos).toBe(0);
    const { tipos } = await uno("SELECT count(DISTINCT tipo)::int AS tipos FROM nodo_topologia WHERE nodo_id::text LIKE $1", [DE_LA_RED]);
    expect(tipos).toBe(5);
  });

  it("ui-scada: cada nodo nuevo tiene sensores con umbrales e historia de lecturas, y uno está desconectado", async () => {
    await aplicar();
    const { rows } = await db().query(
      `SELECT n.estado, count(DISTINCT s.id)::int AS sensores, min(s.umbral_voltaje) AS umbral, count(l.id)::int AS lecturas
       FROM nodos n JOIN sensores s ON s.nodo_id = n.id LEFT JOIN lecturas l ON l.sensor_id = s.id
       WHERE n.id::text LIKE $1 GROUP BY n.id`,
      [DE_LA_RED],
    );
    expect(rows).toHaveLength(11);
    expect(rows.every((r) => r.sensores > 0 && r.umbral > 0 && r.lecturas >= 30)).toBe(true);
    expect(rows.filter((r) => r.estado === "desconectado")).toHaveLength(1);
  });

  it("ui-scada: las lecturas iniciales no superan los umbrales (no hay alertas sin evaluar)", async () => {
    await aplicar();
    const { exceden } = await uno(
      `SELECT count(*)::int AS exceden FROM lecturas l JOIN sensores s ON s.id = l.sensor_id
       WHERE s.id::text LIKE $1 AND (l.voltaje > s.umbral_voltaje OR l.corriente > s.umbral_corriente OR l.potencia > s.umbral_potencia)`,
      [DE_LA_RED],
    );
    expect(exceden).toBe(0);
  });
});
