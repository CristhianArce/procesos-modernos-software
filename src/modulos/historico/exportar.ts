import type { FiltrosHistorico } from "./schema";

/** Máximo de lecturas exportadas, las más recientes (RN-4). */
export const TOPE_EXPORTACION = 10_000;

const CLAVES = ["nodoId", "sensorId", "desde", "hasta"] as const;

/** Enlace de descarga con los filtros aplicados (decisión #6). */
export function enlaceExportar(filtros: FiltrosHistorico): string {
  const params = new URLSearchParams();
  for (const clave of CLAVES) {
    const valor = filtros[clave];
    if (valor) params.set(clave, valor);
  }
  const consulta = params.toString();
  return consulta ? `/api/historico/exportar?${consulta}` : "/api/historico/exportar";
}
