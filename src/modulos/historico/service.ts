import "server-only";
import * as repo from "./repo";
import type { HistoricoFiltros } from "./schema";
import { TAMANO_PAGINA, type PaginaHistorico } from "./tipos";

/** Una página del histórico. Una página más allá de la última devuelve la lista vacía con el total real (decisión #3). */
export async function consultarHistorico({ pagina, ...filtros }: HistoricoFiltros): Promise<PaginaHistorico> {
  const { lecturas, total } = await repo.consultar({ ...filtros, limite: TAMANO_PAGINA, desplazamiento: (pagina - 1) * TAMANO_PAGINA });
  return { lecturas, total, pagina, tamano: TAMANO_PAGINA };
}
