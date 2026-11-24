import { describe, expect, it } from "vitest";
import { POR_PAGINA, consultaHistoricoSchema, filtrosHistoricoSchema } from "../schema";

const NODO = "00000000-0000-4000-8000-000000000901";
const SENSOR = "00000000-0000-4000-8000-000000000911";

describe("esquemas del histórico", () => {
  it("#26 CA-1: POR_PAGINA es 25", () => {
    expect(POR_PAGINA).toBe(25);
  });

  it("#26 CA-1: acepta una consulta sin filtros con pagina 1 por defecto", () => {
    const r = consultaHistoricoSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.pagina).toBe(1);
  });

  it("#26 CA-2: acepta nodo, sensor, rango y página como texto de la URL", () => {
    const r = consultaHistoricoSchema.safeParse({
      nodoId: NODO,
      sensorId: SENSOR,
      desde: "2026-01-10",
      hasta: "2026-01-12",
      pagina: "2",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toMatchObject({ nodoId: NODO, sensorId: SENSOR, desde: "2026-01-10", hasta: "2026-01-12", pagina: 2 });
    }
  });

  it("#26 CA-2: convierte los valores vacíos en ausentes", () => {
    const r = consultaHistoricoSchema.safeParse({ nodoId: "", sensorId: "", desde: "", hasta: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nodoId).toBeUndefined();
      expect(r.data.sensorId).toBeUndefined();
      expect(r.data.desde).toBeUndefined();
      expect(r.data.hasta).toBeUndefined();
    }
  });

  it("#26 CA-2: acepta desde igual a hasta", () => {
    expect(filtrosHistoricoSchema.safeParse({ desde: "2026-01-10", hasta: "2026-01-10" }).success).toBe(true);
  });

  it("#26 CA-4: rechaza una fecha desde inexistente", () => {
    expect(consultaHistoricoSchema.safeParse({ desde: "2026-13-40" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza una fecha hasta que no es una fecha", () => {
    expect(consultaHistoricoSchema.safeParse({ hasta: "ayer" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza desde posterior a hasta", () => {
    expect(consultaHistoricoSchema.safeParse({ desde: "2026-01-12", hasta: "2026-01-10" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza pagina 0 y pagina no numérica", () => {
    expect(consultaHistoricoSchema.safeParse({ pagina: "0" }).success).toBe(false);
    expect(consultaHistoricoSchema.safeParse({ pagina: "abc" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza un nodoId o sensorId que no es UUID", () => {
    expect(consultaHistoricoSchema.safeParse({ nodoId: "no-es-uuid" }).success).toBe(false);
    expect(consultaHistoricoSchema.safeParse({ sensorId: "123" }).success).toBe(false);
  });

  it("#26 CA-2: filtrosHistoricoSchema no incluye pagina", () => {
    const r = filtrosHistoricoSchema.safeParse({ nodoId: NODO, pagina: "3" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).not.toHaveProperty("pagina");
  });
});
