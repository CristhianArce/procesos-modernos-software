import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("db/seed/historico.sql", "utf8");
const SENSOR_A = "b15e0000-0000-4000-8000-000000000911";
const SENSOR_B = "b15e0000-0000-4000-8000-000000000912";

describe("semilla del histórico", () => {
  it("#26 CA-1: historico.sql existe entre las semillas", () => {
    expect(readdirSync("db/seed")).toContain("historico.sql");
  });

  it("#26 CA-1: es idempotente con ON CONFLICT (id) DO NOTHING", () => {
    expect(sql()).toMatch(/ON CONFLICT \(id\) DO NOTHING/i);
  });

  it("#26 CA-2: crea el nodo 901 y los sensores 911 y 912", () => {
    const texto = sql();
    expect(texto).toContain("Nodo histórico demo");
    expect(texto).toContain("b15e0000-0000-4000-8000-000000000901");
    expect(texto).toContain("Medidor histórico A");
    expect(texto).toContain("Medidor histórico B");
    expect(texto).toContain(SENSOR_A);
    expect(texto).toContain(SENSOR_B);
  });

  it("#26 CA-1: trae 26 lecturas del sensor A cada 2 horas desde el 10 de enero", () => {
    const texto = sql();
    expect(texto).toMatch(/generate_series\(1,\s*26\)/);
    expect(texto).toContain("2026-01-10 08:00:00-05");
    expect(texto).toMatch(/interval '2 hours'/);
  });

  it("#26 CA-2: trae 2 lecturas del sensor B en el rango", () => {
    const texto = sql();
    expect(texto).toContain("2026-01-11 09:00:00-05");
    expect(texto).toContain("2026-01-11 10:00:00-05");
    const lineasB = texto.split("\n").filter((l) => l.includes(`'${SENSOR_B}', `) && l.includes("2026-01-11"));
    expect(lineasB).toHaveLength(2);
  });

  it("#26 CA-2: trae 2 lecturas del sensor A fuera del rango, una en el borde de Bogotá", () => {
    const texto = sql();
    expect(texto).toContain("2026-01-09 23:30:00-05");
    expect(texto).toContain("2026-01-13 00:30:00-05");
  });
});
