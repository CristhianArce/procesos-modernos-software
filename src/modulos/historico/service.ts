import "server-only";
import * as repo from "./repo";
import type { FilaHistorico } from "./repo";
import { type HistoricoFiltros, TAMANO_PAGINA } from "./schema";

export type { FilaHistorico } from "./repo";
export type PaginaHistorico = { items: FilaHistorico[]; pagina: number; tamano: number; total: number };

/** Una página del histórico con el total de lecturas que cumplen los filtros (CA-1, CA-2, CA-3). */
export async function consultarHistorico(filtros: HistoricoFiltros): Promise<PaginaHistorico> {
  const [items, total] = await Promise.all([repo.consultar(filtros), repo.contar(filtros)]);
  return { items, pagina: filtros.pagina, tamano: TAMANO_PAGINA, total };
}
