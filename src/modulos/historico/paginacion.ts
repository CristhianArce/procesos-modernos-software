import type { FiltrosHistorico } from "./schema";

const CLAVES = ["nodoId", "sensorId", "desde", "hasta"] as const;

/** Enlace a una página del histórico que conserva los filtros presentes (decisión #8). */
export function enlacePagina(filtros: FiltrosHistorico, pagina: number): string {
  const params = new URLSearchParams();
  for (const clave of CLAVES) {
    const valor = filtros[clave];
    if (valor) params.set(clave, valor);
  }
  params.set("pagina", String(pagina));
  return `/historico?${params}`;
}
