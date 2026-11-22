// Valores simulados (decisiones #4 y #15). El azar se inyecta para probar sin depender de la suerte.
export type Umbrales = { umbralVoltaje: number | null; umbralCorriente: number | null; umbralPotencia: number | null };
export type Magnitudes = { voltaje: number; corriente: number; potencia: number };

export const RANGO_VOLTAJE = [110, 130] as const;
export const RANGO_CORRIENTE = [0.5, 20] as const;
/** Proporción de lecturas que superan un umbral, para poder probar alertas. */
export const PROBABILIDAD_FUERA_DE_UMBRAL = 0.1;
/** Una lectura fuera de umbral lo supera entre un 5 % y un 20 %. */
export const EXCESO = [1.05, 1.2] as const;

const entre = ([min, max]: readonly [number, number], azar: () => number) => min + (max - min) * azar();
const redondear = (n: number) => Math.round(n * 100) / 100;

export function generarLectura(sensor: Umbrales, azar: () => number = Math.random): Magnitudes {
  const voltaje = redondear(entre(RANGO_VOLTAJE, azar));
  const corriente = redondear(entre(RANGO_CORRIENTE, azar));
  const lectura: Magnitudes = { voltaje, corriente, potencia: redondear(voltaje * corriente) };

  const conUmbral = (
    [
      ["voltaje", sensor.umbralVoltaje],
      ["corriente", sensor.umbralCorriente],
      ["potencia", sensor.umbralPotencia],
    ] as const
  ).filter((par): par is [keyof Magnitudes, number] => par[1] !== null);

  if (conUmbral.length > 0 && azar() < PROBABILIDAD_FUERA_DE_UMBRAL) {
    const [magnitud, umbral] = conUmbral[Math.min(Math.floor(azar() * conUmbral.length), conUmbral.length - 1)];
    lectura[magnitud] = redondear(umbral * entre(EXCESO, azar));
  }
  return lectura;
}
