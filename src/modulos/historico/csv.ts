import type { LecturaHistorico } from "./repo";

/** Encabezado del CSV (RN-3, decisión #2). */
export const ENCABEZADO_CSV = "nodo,sensor,voltaje,corriente,potencia,fecha";

const INICIO_FORMULA = /^[=+\-@]/;
const NECESITA_COMILLAS = /[",\r\n]/;

/** Una celda segura: sin fórmulas (RN-2) y con comillas RFC 4180 si hace falta (decisión #4). */
export function celdaCsv(valor: string | number): string {
  const texto = String(valor);
  const sinFormula = INICIO_FORMULA.test(texto) ? `'${texto}` : texto;
  return NECESITA_COMILLAS.test(sinFormula) ? `"${sinFormula.replaceAll('"', '""')}"` : sinFormula;
}

const fila = (l: LecturaHistorico) =>
  [l.nodoNombre, l.sensorNombre, l.voltaje, l.corriente, l.potencia, l.tomadaEn].map(celdaCsv).join(",");

/** El archivo completo: encabezado y una fila por lectura, cada línea con "\r\n" (decisión #5). */
export function aCsv(lecturas: LecturaHistorico[]): string {
  return [ENCABEZADO_CSV, ...lecturas.map(fila)].map((linea) => `${linea}\r\n`).join("");
}
