import type { Magnitudes, Umbrales } from "./generador";

/**
 * Lecturas del simulador continuo (rediseño SCADA): deriva suave hacia una base, con ruido pequeño y picos
 * ocasionales, en vez de valores independientes al azar (el botón Simular de la HU 4 sigue con generador.ts).
 */

export type Base = { voltaje: number; corriente: number };

export const TENSION_NOMINAL = 120;
/** Fracción de la distancia a la base que se recorre en cada paso (reversión a la media). */
const RETORNO = 0.2;
const RUIDO_V = 0.8;
const RUIDO_I = 0.04;
/** Probabilidad de pico por sensor y por paso: con 12 sensores cada 2,5 s, un pico cada ~40 s. */
export const PROBABILIDAD_PICO = 0.005;
const EXCESO_PICO = [1.02, 1.15] as const;

const r2 = (n: number) => Math.round(n * 100) / 100;
const ruido = (azar: () => number) => (azar() - 0.5) * 2;

/** Techo de la base frente a los umbrales: la operación normal no debe generar alertas, solo los picos. */
const MARGEN_BASE = 0.8;

/**
 * La corriente de trabajo de un sensor: la de su última lectura o el 60 % de su umbral, sin pasar del 80 % del umbral
 * de corriente ni del que llevaría la potencia al 80 % de su umbral (una lectura vieja puede estar por encima).
 */
export function baseDe(ultima: Base | null, u: Umbrales): Base {
  const techos = [u.umbralCorriente && u.umbralCorriente * MARGEN_BASE, u.umbralPotencia && (u.umbralPotencia * MARGEN_BASE) / TENSION_NOMINAL].filter(
    (x): x is number => typeof x === "number",
  );
  const corriente = ultima?.corriente ?? (u.umbralCorriente ? u.umbralCorriente * 0.6 : 8);
  return { voltaje: TENSION_NOMINAL, corriente: r2(Math.min(corriente, ...techos)) };
}

/**
 * Siguiente lectura y el estado de la deriva para el próximo paso (sin el pico: un pico es momentáneo).
 * Orden de uso del azar: ¿pico?, ruido de tensión, ruido de corriente y, si hay pico, magnitud y exceso.
 */
export function siguienteLectura(previa: Base, base: Base, u: Umbrales, azar: () => number = Math.random): { lectura: Magnitudes; deriva: Base } {
  const conUmbral = (
    [
      ["voltaje", u.umbralVoltaje],
      ["corriente", u.umbralCorriente],
      ["potencia", u.umbralPotencia],
    ] as const
  ).filter((p): p is [keyof Magnitudes, number] => p[1] !== null);
  const pico = azar() < PROBABILIDAD_PICO && conUmbral.length > 0;

  const voltaje = r2(Math.max(1, previa.voltaje + RETORNO * (base.voltaje - previa.voltaje) + RUIDO_V * ruido(azar)));
  const corriente = r2(Math.max(0.1, previa.corriente + RETORNO * (base.corriente - previa.corriente) + RUIDO_I * base.corriente * ruido(azar)));
  const lectura: Magnitudes = { voltaje, corriente, potencia: r2(voltaje * corriente) };

  if (pico) {
    const [magnitud, umbral] = conUmbral[Math.min(Math.floor(azar() * conUmbral.length), conUmbral.length - 1)];
    lectura[magnitud] = r2(umbral * (EXCESO_PICO[0] + (EXCESO_PICO[1] - EXCESO_PICO[0]) * azar()));
  }
  return { lectura, deriva: { voltaje, corriente } };
}
