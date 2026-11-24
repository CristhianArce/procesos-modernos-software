import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// npm run seed aplica db/seed/*.sql en orden alfabético.
const archivos = readdirSync("db/seed").filter((f) => f.endsWith(".sql")).sort();
const sql = () => readFileSync("db/seed/nodos_usuarios.sql", "utf8");

describe("semilla de afectados", () => {
  it("#25 CA-1: nodos_usuarios.sql ordena después de nodos.sql", () => {
    expect(archivos).toContain("nodos_usuarios.sql");
    expect(archivos.indexOf("nodos_usuarios.sql")).toBeGreaterThan(archivos.indexOf("nodos.sql"));
  });

  it("#25 CA-3: es idempotente con ON CONFLICT (id) DO NOTHING", () => {
    expect(sql()).toMatch(/ON CONFLICT \(id\) DO NOTHING/i);
  });

  it("#25 CA-1: inserta Usuario demo 02 en el nodo ...0002 con id fijo", () => {
    const texto = sql();
    expect(texto).toContain("Usuario demo 02");
    expect(texto).toContain("00000000-0000-4000-8000-000000002001");
    expect(texto).toContain("00000000-0000-4000-8000-000000000002");
    expect(texto).toMatch(/nodo_usuarios/);
  });
});
