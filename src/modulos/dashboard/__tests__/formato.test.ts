import { describe, expect, it } from "vitest";
import { conUnidad, formatearFecha, TITULO } from "../formato";

describe("formato del dashboard", () => {
  it("#22 CA-1: la fecha sale en es-CO y en la hora de Bogotá", () => {
    const texto = formatearFecha("2026-11-22T15:30:05Z");
    expect(texto).toContain("22/11/");
    expect(texto).toContain("10:30:05");
  });

  it("#22 CA-1: cada magnitud lleva su unidad V, A o W", () => {
    expect([conUnidad(120.4, "voltaje"), conUnidad(9.8, "corriente"), conUnidad(1179.92, "potencia")]).toEqual(["120.4 V", "9.8 A", "1179.92 W"]);
    expect(TITULO).toEqual({ voltaje: "Voltaje (V)", corriente: "Corriente (A)", potencia: "Potencia (W)" });
  });
});
