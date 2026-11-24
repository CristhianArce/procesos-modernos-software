type Props = { pagina: number; total: number; tamano: number; parametros: URLSearchParams };

/** Enlace a otra página conservando los filtros de la URL. */
const enlace = (parametros: URLSearchParams, pagina: number) => {
  const p = new URLSearchParams(parametros);
  p.set("pagina", String(pagina));
  return `/historico?${p.toString()}`;
};

/** Resumen «Página X de Y» y enlaces Anterior/Siguiente; en los extremos son texto atenuado. */
export function PaginacionHistorico({ pagina, total, tamano, parametros }: Props) {
  const paginas = Math.max(1, Math.ceil(total / tamano));
  return (
    <nav aria-label="Paginación del histórico" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="cifra text-tenue" data-testid="resumen-pagina">
        {`Página ${pagina} de ${paginas} · ${total} lecturas`}
      </p>
      <div className="flex items-center gap-4">
        {pagina > 1 ? (
          <a href={enlace(parametros, pagina - 1)} className="enlace">
            Anterior
          </a>
        ) : (
          <span className="text-apagado">Anterior</span>
        )}
        {pagina < paginas ? (
          <a href={enlace(parametros, pagina + 1)} className="enlace">
            Siguiente
          </a>
        ) : (
          <span className="text-apagado">Siguiente</span>
        )}
      </div>
    </nav>
  );
}
