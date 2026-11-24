import { readdirSync, readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

// npm run seed aplica los archivos en orden alfabético: nodos_afectados.sql va después de nodos.sql.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const aplicar = async () => {
  for (const f of archivos) await db().query(readFileSync(`db/seed/${f}`, "utf8"));
};
const SUR = "00000000-0000-4000-8000-000000000002";
const NORTE = "00000000-0000-4000-8000-000000000001";
const DE_LA_SEMILLA = "00000000-0000-4000-8000-0000000a%";
const deLaSemilla = async (nodoId: string) =>
  (await db().query("SELECT id, alias FROM nodo_usuarios WHERE nodo_id = $1 AND id::text LIKE $2 ORDER BY id", [nodoId, DE_LA_SEMILLA])).rows;

afterAll(() => db().end());

describe("semilla de afectados", () => {
  it("#25 CA-1: se aplica después de la semilla de nodos", () => {
    expect(archivos).toContain("nodos_afectados.sql");
    expect(archivos.indexOf("nodos_afectados.sql")).toBeGreaterThan(archivos.indexOf("nodos.sql"));
  });

  it("#25 CA-1: se puede aplicar dos veces sin duplicar afectados", async () => {
    await aplicar();
    const antes = await deLaSemilla(SUR);
    await aplicar();
    expect(await deLaSemilla(SUR)).toEqual(antes);
  });

  it("#25 CA-1: Subestación Sur tiene el afectado «Usuario demo 02»", async () => {
    await aplicar();
    expect(await deLaSemilla(SUR)).toEqual([{ id: "00000000-0000-4000-8000-0000000a0001", alias: "Usuario demo 02" }]);
  });

  it("#25 CA-3: Subestación Norte no tiene afectados de la semilla", async () => {
    await aplicar();
    expect(await deLaSemilla(NORTE)).toEqual([]);
  });
});
