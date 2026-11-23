import { describe, expect, it } from "vitest";
import { ESTADOS, nivelFrenteAUmbral, peorEstado } from "../estado";
import { escalaMedidor } from "../escala-medidor";
import { trazoSparkline } from "../trazo-sparkline";

describe("estado frente a un umbral", () => {
  it("ui-scada: por encima del umbral es crítico", () => {
    expect(nivelFrenteAUmbral(126, 125)).toBe("critico");
  });

  it("ui-scada: desde el 90 % del umbral es advertencia", () => {
    expect(nivelFrenteAUmbral(112.5, 125)).toBe("advertencia");
    expect(nivelFrenteAUmbral(125, 125)).toBe("advertencia");
  });

  it("ui-scada: por debajo del 90 % o sin umbral es normal", () => {
    expect(nivelFrenteAUmbral(112.4, 125)).toBe("normal");
    expect(nivelFrenteAUmbral(9999, null)).toBe("normal");
  });

  it("ui-scada: sin valor es sin-datos", () => {
    expect(nivelFrenteAUmbral(null, 125)).toBe("sin-datos");
  });

  it("ui-scada: el peor estado manda y una lista vacía es sin-datos", () => {
    expect(peorEstado(["normal", "advertencia", "normal"])).toBe("advertencia");
    expect(peorEstado(["advertencia", "critico"])).toBe("critico");
    expect(peorEstado(["normal", "desconectado"])).toBe("desconectado");
    expect(peorEstado([])).toBe("sin-datos");
  });

  it("ui-scada: cada estado tiene etiqueta en español y una forma distinta", () => {
    const formas = Object.values(ESTADOS).map((e) => e.forma);
    expect(new Set(formas).size).toBe(formas.length);
    expect(ESTADOS.critico.etiqueta).toBe("Crítico");
  });
});

describe("escala del medidor", () => {
  it("ui-scada: la escala llega a umbral × 1,25 y marca el umbral al 80 %", () => {
    expect(escalaMedidor(50, 100)).toEqual({ maximo: 125, fraccion: 0.4, fraccionUmbral: 0.8, nivel: "normal" });
  });

  it("ui-scada: si el valor supera la escala, la escala crece hasta el valor", () => {
    const e = escalaMedidor(200, 100);
    expect(e.maximo).toBe(200);
    expect(e.fraccion).toBe(1);
    expect(e.fraccionUmbral).toBe(0.5);
    expect(e.nivel).toBe("critico");
  });

  it("ui-scada: sin umbral la escala es el valor × 1,25 y no hay marca", () => {
    expect(escalaMedidor(80, null)).toEqual({ maximo: 100, fraccion: 0.8, fraccionUmbral: null, nivel: "normal" });
  });

  it("ui-scada: sin valor la barra queda vacía y el nivel es sin-datos", () => {
    expect(escalaMedidor(null, 100)).toMatchObject({ fraccion: 0, nivel: "sin-datos" });
  });
});

describe("trazo de la minigráfica", () => {
  it("ui-scada: escala los valores al alto y al ancho, con el mínimo abajo", () => {
    expect(trazoSparkline([0, 5, 10], 100, 20)).toBe("M0,20L50,10L100,0");
  });

  it("ui-scada: una serie plana queda centrada", () => {
    expect(trazoSparkline([3, 3], 10, 20)).toBe("M0,10L10,10");
  });

  it("ui-scada: menos de dos valores no dibuja nada", () => {
    expect(trazoSparkline([4], 10, 10)).toBe("");
    expect(trazoSparkline([], 10, 10)).toBe("");
  });

  it("ui-scada: redondea a un decimal para que el SVG sea compacto", () => {
    expect(trazoSparkline([0, 1, 3], 10, 10)).toBe("M0,10L5,6.7L10,0");
  });
});
