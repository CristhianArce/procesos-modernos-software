import { describe, expect, it } from "vitest";
import { generarLectura } from "../generador";

const sinUmbrales = { umbralVoltaje: null, umbralCorriente: null, umbralPotencia: null };
const conUmbrales = { umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: 1800 };

/** Azar determinista: devuelve los valores dados, en orden, y repite el último. */
const azarFijo = (...valores: number[]) => {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)];
};

const dentroDelRango = ({ voltaje, corriente, potencia }: ReturnType<typeof generarLectura>) => {
  expect(voltaje).toBeGreaterThanOrEqual(110);
  expect(voltaje).toBeLessThanOrEqual(130);
  expect(corriente).toBeGreaterThanOrEqual(0.5);
  expect(corriente).toBeLessThanOrEqual(20);
  expect(potencia).toBe(Math.round(voltaje * corriente * 100) / 100);
};

describe("generador de lecturas", () => {
  it("#21 CA-6: una lectura normal queda en el rango y su potencia es voltaje por corriente", () => {
    for (const valor of [0, 0.25, 0.5, 0.999]) dentroDelRango(generarLectura(conUmbrales, azarFijo(valor, valor, 0.9)));
    expect(generarLectura(conUmbrales, azarFijo(0.5, 0.5, 0.9))).toEqual({ voltaje: 120, corriente: 10.25, potencia: 1230 });
  });

  it("#21 CA-6: con el azar real también queda en el rango cuando no hay umbrales", () => {
    for (let i = 0; i < 200; i++) dentroDelRango(generarLectura(sinUmbrales));
  });

  it.each([
    ["voltaje", 0, 125],
    ["corriente", 0.4, 15],
    ["potencia", 0.9, 1800],
  ] as const)("#21 CA-6: una lectura fuera de rango supera el umbral de %s entre 5 %% y 20 %%", (magnitud, eleccion, umbral) => {
    for (const exceso of [0, 0.5, 0.999]) {
      // voltaje, corriente, sorteo (< 0,1: sale fuera de umbral), magnitud elegida y exceso
      const lectura = generarLectura(conUmbrales, azarFijo(0.5, 0.5, 0.05, eleccion, exceso));
      expect(lectura[magnitud]).toBeGreaterThanOrEqual(umbral * 1.05 - 0.01);
      expect(lectura[magnitud]).toBeLessThanOrEqual(umbral * 1.2 + 0.01);
    }
  });

  it("#21 CA-6: solo se sale del umbral de una magnitud que lo tiene", () => {
    const soloCorriente = { ...sinUmbrales, umbralCorriente: 15 };
    const lectura = generarLectura(soloCorriente, azarFijo(0.5, 0.5, 0.05, 0.99, 0.5));
    expect(lectura.voltaje).toBe(120);
    expect(lectura.corriente).toBeGreaterThan(15);
  });

  it("#21 CA-6: un sensor sin umbrales nunca sale del rango, aunque el sorteo sea bajo", () => {
    dentroDelRango(generarLectura(sinUmbrales, azarFijo(0.5, 0.5, 0)));
  });
});
