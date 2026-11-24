import "server-only";
import * as repo from "./repo";
import type { LecturaHistorico } from "./repo";
import { POR_PAGINA, type ConsultaHistorico } from "./schema";

export type { LecturaHistorico } from "./repo";

export type PaginaHistorico = { items: LecturaHistorico[]; pagina: number; porPagina: number; total: number };

/** Una página del histórico con el total de lecturas que cumplen los filtros (CA-1, CA-2, CA-3). */
export async function consultarHistorico(consulta: ConsultaHistorico): Promise<PaginaHistorico> {
  const [items, total] = await Promise.all([repo.listar(consulta), repo.contar(consulta)]);
  return { items, pagina: consulta.pagina, porPagina: POR_PAGINA, total };
}
