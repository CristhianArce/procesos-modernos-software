import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// npm run seed aplica db/seed/*.sql en orden alfabético.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const sql = () => readFileSync("db/seed/nodos_tecnicos.sql", "utf8");

describe("semilla de mantenimiento", () => {
  it("#27 CA-1: nodos_tecnicos.sql ordena después de auth.sql y nodos.sql", () => {
    expect(archivos).toContain("nodos_tecnicos.sql");
    expect(archivos.indexOf("nodos_tecnicos.sql")).toBeGreaterThan(archivos.indexOf("auth.sql"));
    expect(archivos.indexOf("nodos_tecnicos.sql")).toBeGreaterThan(archivos.indexOf("nodos.sql"));
  });

  it("#27 CA-1: asigna el usuario tecnico al nodo ...0001", () => {
    const texto = sql();
    expect(texto).toContain("00000000-0000-4000-8000-000000000001");
    expect(texto).toContain("'tecnico'");
    expect(texto).toMatch(/nodo_tecnicos/);
  });

  it("#27 CA-1: es idempotente con ON CONFLICT (nodo_id) DO NOTHING", () => {
    expect(sql()).toMatch(/ON CONFLICT \(nodo_id\) DO NOTHING/i);
  });
});
