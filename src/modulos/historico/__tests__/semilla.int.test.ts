import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

const aplicar = () => db().query(readFileSync("db/seed/historico.sql", "utf8"));
const NODO_1 = "%-000000000301";
const NODO_2 = "%-000000000302";
const uno = async (sql: string, p: unknown[] = []) => (await db().query(sql, p)).rows[0];
const lecturasDe = (nodo: string, extra = "") =>
  uno(
    `SELECT count(*)::int AS n FROM lecturas l JOIN sensores s ON s.id = l.sensor_id
     WHERE s.nodo_id::text LIKE $1 ${extra}`,
    [nodo],
  );

afterAll(() => db().end());

describe("semilla del histórico", () => {
  it("#26 CA-2: deja 26 lecturas del nodo 0301 entre el 2026-03-01 y el 2026-03-31", async () => {
    await aplicar();
    const { n } = await lecturasDe(
      NODO_1,
      "AND l.tomada_en >= '2026-03-01T00:00:00Z' AND l.tomada_en <= '2026-03-31T23:59:59Z'",
    );
    expect(n).toBe(26);
  });

  it("#26 CA-2: deja dos lecturas del nodo 0301 fuera del rango y tres del nodo 0302 dentro", async () => {
    await aplicar();
    const { n: fuera } = await lecturasDe(
      NODO_1,
      "AND (l.tomada_en < '2026-03-01T00:00:00Z' OR l.tomada_en > '2026-03-31T23:59:59Z') AND l.tomada_en BETWEEN '2026-02-01' AND '2026-05-01'",
    );
    const { n: otro } = await lecturasDe(
      NODO_2,
      "AND l.tomada_en >= '2026-03-01T00:00:00Z' AND l.tomada_en <= '2026-03-31T23:59:59Z'",
    );
    expect(fuera).toBe(2);
    expect(otro).toBe(3);
  });

  it("#26 CA-2: el nodo 0301 tiene dos sensores y el 0302 uno", async () => {
    await aplicar();
    const a = await uno("SELECT count(*)::int AS n FROM sensores WHERE nodo_id::text LIKE $1", [NODO_1]);
    const b = await uno("SELECT count(*)::int AS n FROM sensores WHERE nodo_id::text LIKE $1", [NODO_2]);
    expect(a.n).toBe(2);
    expect(b.n).toBe(1);
  });

  it("#26 CA-1: aplicarla dos veces no duplica nada", async () => {
    await aplicar();
    const contarTodo = () =>
      uno(
        `SELECT (SELECT count(*) FROM nodos WHERE id::text LIKE $1 OR id::text LIKE $2)::int AS nodos,
                (SELECT count(*) FROM sensores WHERE nodo_id::text LIKE $1 OR nodo_id::text LIKE $2)::int AS sensores,
                (SELECT count(*) FROM lecturas l JOIN sensores s ON s.id = l.sensor_id
                  WHERE (s.nodo_id::text LIKE $1 OR s.nodo_id::text LIKE $2)
                    AND l.tomada_en BETWEEN '2026-02-01' AND '2026-05-01')::int AS lecturas`,
        [NODO_1, NODO_2],
      );
    const antes = await contarTodo();
    await aplicar();
    expect(await contarTodo()).toEqual(antes);
    expect(antes).toEqual({ nodos: 2, sensores: 3, lecturas: 31 });
  });
});
