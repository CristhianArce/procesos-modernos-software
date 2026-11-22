import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: nodos.sql antes que sensores.sql.
const semillas = ["db/seed/nodos.sql", "db/seed/sensores.sql"].map((ruta) => readFileSync(ruta, "utf8"));
const aplicar = async () => {
  for (const sql of semillas) await db().query(sql);
};

// Los identificadores de la semilla empiezan así; los que genera la app son aleatorios.
const DE_LA_SEMILLA = "00000000-0000-4000-8000-%";
const contar = async (tabla: "nodos" | "sensores" | "lecturas") =>
  (await db().query(`SELECT count(*)::int AS filas FROM ${tabla} WHERE id::text LIKE $1`, [DE_LA_SEMILLA])).rows[0].filas as number;

afterAll(() => db().end());

describe("semilla de nodos y sensores", () => {
  it("#21 CA-7: se puede aplicar dos veces sin duplicar nodos, sensores ni lecturas", async () => {
    await aplicar();
    const antes = await Promise.all([contar("nodos"), contar("sensores"), contar("lecturas")]);
    await aplicar();
    expect(await Promise.all([contar("nodos"), contar("sensores"), contar("lecturas")])).toEqual(antes);
    expect(antes).toEqual([2, 3, 3]);
  });

  it("#21 CA-7: cada nodo de la semilla tiene sensores y cada sensor al menos una lectura", async () => {
    await aplicar();
    const { rows: nodos } = await db().query(
      "SELECT n.nombre, n.estado, count(s.id)::int AS sensores FROM nodos n LEFT JOIN sensores s ON s.nodo_id = n.id WHERE n.id::text LIKE $1 GROUP BY n.id",
      [DE_LA_SEMILLA],
    );
    expect(nodos).toHaveLength(2);
    expect(nodos.every((n) => n.sensores > 0 && n.estado === "conectado")).toBe(true);

    const { rows: sensores } = await db().query(
      "SELECT count(l.id)::int AS lecturas FROM sensores s LEFT JOIN lecturas l ON l.sensor_id = s.id WHERE s.id::text LIKE $1 GROUP BY s.id",
      [DE_LA_SEMILLA],
    );
    expect(sensores.every((s) => s.lecturas > 0)).toBe(true);
  });
});
