import { describe, expect, it } from "vitest";
import { consultaHistoricoSchema, filtrosHistoricoSchema, POR_PAGINA } from "../schema";

const NODO = "00000000-0000-0000-0000-000000000301";
const SENSOR = "00000000-0000-0000-0000-000000000311";

const camposConError = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  (r.error?.issues ?? []).map((i) => String(i.path[0]));

describe("esquema del histórico", () => {
  it("#26 CA-1: son 25 lecturas por página", () => {
    expect(POR_PAGINA).toBe(25);
  });

  it("#26 CA-1: sin parámetros se acepta con la página 1", () => {
    const r = consultaHistoricoSchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data?.pagina).toBe(1);
  });

  it("#26 CA-2: acepta nodo, sensor y fechas ISO en UTC", () => {
    const r = consultaHistoricoSchema.safeParse({
      nodoId: NODO,
      sensorId: SENSOR,
      desde: "2026-03-01T00:00:00Z",
      hasta: "2026-03-31T23:59:59Z",
    });
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ nodoId: NODO, sensorId: SENSOR, desde: "2026-03-01T00:00:00Z", hasta: "2026-03-31T23:59:59Z" });
  });

  it("#26 CA-4: acepta desde igual a hasta", () => {
    const f = "2026-03-10T12:00:00Z";
    expect(consultaHistoricoSchema.safeParse({ desde: f, hasta: f }).success).toBe(true);
  });

  it("#26 CA-1: la página llega como texto entero mayor o igual que 1", () => {
    expect(consultaHistoricoSchema.safeParse({ pagina: "3" }).data?.pagina).toBe(3);
  });

  it("#26 CA-4: rechaza una fecha mal formada", () => {
    for (const desde of ["ayer", "2026-03-01"]) {
      const r = consultaHistoricoSchema.safeParse({ desde });
      expect(r.success).toBe(false);
      expect(camposConError(r)).toContain("desde");
    }
    const r = consultaHistoricoSchema.safeParse({ hasta: "ayer" });
    expect(camposConError(r)).toContain("hasta");
  });

  it("#26 CA-4: rechaza un identificador que no es UUID", () => {
    expect(camposConError(consultaHistoricoSchema.safeParse({ nodoId: "nodo-1" }))).toContain("nodoId");
    expect(camposConError(consultaHistoricoSchema.safeParse({ sensorId: "123" }))).toContain("sensorId");
  });

  it("#26 CA-4: rechaza una página 0 o decimal", () => {
    for (const pagina of ["0", "1.5", "-2"]) {
      const r = consultaHistoricoSchema.safeParse({ pagina });
      expect(r.success).toBe(false);
      expect(camposConError(r)).toContain("pagina");
    }
  });

  it("#26 CA-4: rechaza desde posterior a hasta con el error en hasta", () => {
    const r = consultaHistoricoSchema.safeParse({ desde: "2026-03-31T00:00:00Z", hasta: "2026-03-01T00:00:00Z" });
    expect(r.success).toBe(false);
    expect(camposConError(r)).toEqual(["hasta"]);
  });

  it("#26 CA-4: filtrosHistoricoSchema aplica la misma regla de rango", () => {
    expect(filtrosHistoricoSchema.safeParse({ desde: "2026-03-01T00:00:00Z", hasta: "2026-03-31T00:00:00Z" }).success).toBe(true);
    const r = filtrosHistoricoSchema.safeParse({ desde: "2026-03-31T00:00:00Z", hasta: "2026-03-01T00:00:00Z" });
    expect(r.success).toBe(false);
    expect(camposConError(r)).toEqual(["hasta"]);
  });
});
