import { describe, expect, it } from "vitest";
import { TAMANO_PAGINA, historicoFiltrosSchema } from "../schema";

const UUID = "3f8a1c2e-5b6d-4e7f-8a9b-0c1d2e3f4a5b";

describe("esquema de filtros del histórico", () => {
  it("#26 CA-1: el tamaño de página es 25 y la página por defecto es 1", () => {
    expect(TAMANO_PAGINA).toBe(25);
    expect(historicoFiltrosSchema.parse({}).pagina).toBe(1);
  });

  it("#26 CA-1: la página llega como texto y se convierte a entero", () => {
    expect(historicoFiltrosSchema.parse({ pagina: "2" }).pagina).toBe(2);
  });

  it("#26 CA-2: acepta nodo, sensor y rango válidos", () => {
    const r = historicoFiltrosSchema.safeParse({
      nodoId: UUID,
      sensorId: UUID,
      desde: "2026-11-01T00:00:00Z",
      hasta: "2026-11-02T00:00:00Z",
    });
    expect(r.success).toBe(true);
  });

  it("#26 CA-2: sin filtros es válido (todos son opcionales)", () => {
    expect(historicoFiltrosSchema.safeParse({}).success).toBe(true);
  });

  it("#26 CA-2: desde igual a hasta es válido", () => {
    const f = "2026-11-01T00:00:00Z";
    expect(historicoFiltrosSchema.safeParse({ desde: f, hasta: f }).success).toBe(true);
  });

  it("#26 CA-4: rechaza una fecha mal formada", () => {
    expect(historicoFiltrosSchema.safeParse({ desde: "ayer" }).success).toBe(false);
    expect(historicoFiltrosSchema.safeParse({ hasta: "2026-13-45" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza una fecha sin hora en UTC", () => {
    expect(historicoFiltrosSchema.safeParse({ desde: "2026-11-01" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza un rango con desde posterior a hasta", () => {
    const r = historicoFiltrosSchema.safeParse({
      desde: "2026-11-02T00:00:00Z",
      hasta: "2026-11-01T00:00:00Z",
    });
    expect(r.success).toBe(false);
  });

  it("#26 CA-4: rechaza un identificador que no es UUID", () => {
    expect(historicoFiltrosSchema.safeParse({ nodoId: "nodo-1" }).success).toBe(false);
    expect(historicoFiltrosSchema.safeParse({ sensorId: "123" }).success).toBe(false);
  });

  it("#26 CA-4: rechaza página 0, negativa o no entera", () => {
    for (const pagina of ["0", "-1", "1.5", "abc"]) {
      expect(historicoFiltrosSchema.safeParse({ pagina }).success).toBe(false);
    }
  });
});
