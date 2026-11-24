import { describe, expect, it } from "vitest";
import { PROBABILIDAD_PICO, baseDe, siguienteLectura } from "../deriva";

/** Azar con una secuencia fija: cada llamada devuelve el siguiente valor (y repite el último). */
const secuencia = (...valores: number[]) => {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)];
};
const sinUmbrales = { umbralVoltaje: null, umbralCorriente: null, umbralPotencia: null };
const umbrales = { umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: 1800 };

describe("simulador con deriva", () => {
  it("ui-scada: sin ruido, la lectura se acerca un 20 % a su base y la potencia es V × A", () => {
    const { lectura: l } = siguienteLectura({ voltaje: 110, corriente: 12 }, { voltaje: 120, corriente: 10 }, sinUmbrales, secuencia(0.5));
    expect(l).toEqual({ voltaje: 112, corriente: 11.6, potencia: 1299.2 });
  });

  it("ui-scada: el ruido es pequeño: como mucho ±0,8 V y ±4 % de la corriente base por paso", () => {
    const { lectura: alto } = siguienteLectura({ voltaje: 120, corriente: 10 }, { voltaje: 120, corriente: 10 }, sinUmbrales, secuencia(0.99, 1, 1));
    expect(alto.voltaje).toBe(120.8);
    expect(alto.corriente).toBe(10.4);
  });

  it("ui-scada: de vez en cuando hay un pico que supera un umbral entre un 2 % y un 15 %", () => {
    // 1.º valor < probabilidad: hay pico; ruido nulo; magnitud: la segunda con umbral (corriente); exceso: el máximo.
    const { lectura: l, deriva } = siguienteLectura({ voltaje: 120, corriente: 10 }, { voltaje: 120, corriente: 10 }, umbrales, secuencia(PROBABILIDAD_PICO / 2, 0.5, 0.5, 0.5, 1));
    expect(l.corriente).toBe(17.25);
    expect(l.voltaje).toBe(120);
    expect(deriva).toEqual({ voltaje: 120, corriente: 10 }); // el pico no arrastra la deriva
  });

  it("ui-scada: sin umbrales no hay picos", () => {
    const { lectura: l } = siguienteLectura({ voltaje: 120, corriente: 10 }, { voltaje: 120, corriente: 10 }, sinUmbrales, secuencia(0, 0.5));
    expect(l).toEqual({ voltaje: 120, corriente: 10, potencia: 1200 });
  });

  it("ui-scada: la base sale de la última lectura o, sin ella, del umbral de corriente", () => {
    expect(baseDe({ voltaje: 121, corriente: 7 }, umbrales)).toEqual({ voltaje: 120, corriente: 7 });
    expect(baseDe(null, umbrales)).toEqual({ voltaje: 120, corriente: 9 });
    expect(baseDe(null, sinUmbrales)).toEqual({ voltaje: 120, corriente: 8 });
  });

  it("ui-scada: la base nunca pasa del 80 % del umbral de corriente ni del de potencia, aunque la última lectura sí", () => {
    expect(baseDe({ voltaje: 123, corriente: 14.4 }, { umbralVoltaje: 125, umbralCorriente: 12, umbralPotencia: null })).toEqual({ voltaje: 120, corriente: 9.6 });
    // 1400 W × 0,8 / 120 V = 9,33 A
    expect(baseDe({ voltaje: 123, corriente: 14.4 }, { umbralVoltaje: 125, umbralCorriente: null, umbralPotencia: 1400 })).toEqual({ voltaje: 120, corriente: 9.33 });
  });
});
