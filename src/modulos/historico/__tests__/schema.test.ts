import { describe, expect, it } from "vitest";
import { TAMANO_PAGINA } from "../tipos";
import { historicoFiltrosSchema } from "../schema";

const guid = "00000000-0000-4000-8000-000000000101";
const t1 = "2026-11-24T10:00:00Z";
const t2 = "2026-11-24T12:00:00-05:00";

describe("filtros del histórico", () => {
  it("#26 CA-1: el tamaño de página es 25", () => {
    expect(TAMANO_PAGINA).toBe(25);
  });

  it("#26 CA-1: sin parámetros toma la página 1", () => {
    expect(historicoFiltrosSchema.parse({})).toEqual({ pagina: 1 });
  });

  it("#26 CA-2: acepta nodo, sensor, rango y página en texto", () => {
    const r = historicoFiltrosSchema.parse({ nodoId: guid, sensorId: guid, desde: t1, hasta: t2, pagina: "2" });
    expect(r).toEqual({ nodoId: guid, sensorId: guid, desde: t1, hasta: t2, pagina: 2 });
  });

  it("#26 CA-2: un parámetro vacío se trata como ausente", () => {
    const r = historicoFiltrosSchema.parse({ nodoId: "", sensorId: "", desde: "", hasta: "", pagina: "" });
    expect(r).toEqual({ pagina: 1 });
  });

  it("#26 CA-2: acepta desde igual a hasta", () => {
    expect(historicoFiltrosSchema.safeParse({ desde: t1, hasta: t1 }).success).toBe(true);
  });

  it.each([
    ["desde=ayer", { desde: "ayer" }],
    ["hasta sin zona", { hasta: "2026-11-24T10:00:00" }],
    ["fecha sin hora", { desde: "2026-11-24" }],
    ["rango invertido", { desde: "2026-11-24T12:00:00Z", hasta: "2026-11-24T10:00:00Z" }],
    ["sensorId=abc", { sensorId: "abc" }],
    ["nodoId=abc", { nodoId: "abc" }],
    ["pagina=0", { pagina: "0" }],
    ["pagina negativa", { pagina: "-1" }],
    ["pagina decimal", { pagina: "1.5" }],
    ["pagina no numérica", { pagina: "x" }],
  ])("#26 CA-4: rechaza %s", (_caso, entrada) => {
    expect(historicoFiltrosSchema.safeParse(entrada).success).toBe(false);
  });

  it("#26 CA-4: el error de una fecha mal formada nombra el campo desde", () => {
    const r = historicoFiltrosSchema.safeParse({ desde: "ayer" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "desde")).toBe(true);
  });
});
