import { nivelFrenteAUmbral, type Estado } from "./estado";

/** Holgura de la escala por encima del umbral (o del valor si no hay umbral): decisión #5 del plan. */
const HOLGURA = 1.25;

export type EscalaMedidor = { maximo: number; fraccion: number; fraccionUmbral: number | null; nivel: Estado };

const recortar = (x: number) => Math.min(1, Math.max(0, x));

export function escalaMedidor(valor: number | null, umbral: number | null): EscalaMedidor {
  const base = umbral ?? valor ?? 0;
  const maximo = Math.max(base * HOLGURA, valor ?? 0) || 1;
  return {
    maximo,
    fraccion: valor === null ? 0 : recortar(valor / maximo),
    fraccionUmbral: umbral === null ? null : recortar(umbral / maximo),
    nivel: nivelFrenteAUmbral(valor, umbral),
  };
}
