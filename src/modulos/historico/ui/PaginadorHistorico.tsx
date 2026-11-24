import Link from "next/link";
import { enlacePagina } from "../url";

type Props = { pagina: number; total: number; porPagina: number; filtros: Record<string, string> };

/** Total de lecturas y navegación entre páginas, que conserva los filtros aplicados. */
export function PaginadorHistorico({ pagina, total, porPagina, filtros }: Props) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const anterior = pagina > 1 ? <Link href={enlacePagina(filtros, pagina - 1)} className="enlace">Anterior</Link> : <span className="text-apagado">Anterior</span>;
  const siguiente = pagina < paginas ? <Link href={enlacePagina(filtros, pagina + 1)} className="enlace">Siguiente</Link> : <span className="text-apagado">Siguiente</span>;

  return (
    <nav aria-label="Paginación del histórico" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-tenue" data-testid="total-historico">{`${total} lecturas`}</p>
      <div className="flex items-center gap-4">
        {anterior}
        <span data-testid="pagina-actual">{`Página ${pagina} de ${paginas}`}</span>
        {siguiente}
      </div>
    </nav>
  );
}
