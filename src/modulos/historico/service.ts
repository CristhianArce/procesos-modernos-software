import "server-only";
import * as repo from "./repo";
import type { LecturaHistorico } from "./repo";
import { POR_PAGINA, type ConsultaHistorico } from "./schema";

export type { LecturaHistorico } from "./repo";
export type HistoricoPagina = { pagina: number; porPagina: number; total: number; totalPaginas: number; lecturas: LecturaHistorico[] };

/** Una página del histórico con su total (CA-1); una página posterior a la última viene vacía (decisión #5). */
export async function consultarHistorico({ pagina, ...filtros }: ConsultaHistorico): Promise<HistoricoPagina> {
  const [total, lecturas] = await Promise.all([repo.contar(filtros), repo.listarPagina(filtros, pagina)]);
  return { pagina, porPagina: POR_PAGINA, total, totalPaginas: Math.ceil(total / POR_PAGINA), lecturas };
}
