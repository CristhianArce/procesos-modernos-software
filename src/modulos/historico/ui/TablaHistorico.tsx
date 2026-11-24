import { formatearFecha } from "@/modulos/dashboard/formato";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { enlaceExportar } from "../exportar";
import { enlacePagina } from "../paginacion";
import type { FiltrosHistorico } from "../schema";
import type { HistoricoPagina } from "../service";

type Props = { resultado: HistoricoPagina; filtros: FiltrosHistorico };

// Descarga con la sesión de la cookie; la API responde como adjunto (HU 16, decisión #6).
function EnlaceExportar({ filtros }: { filtros: FiltrosHistorico }) {
  return (
    <a data-testid="exportar-csv" href={enlaceExportar(filtros)} download className="enlace text-sm">
      Exportar CSV
    </a>
  );
}

/** Una página del histórico, la más reciente primero, con su total y los enlaces de página (CA-1, CA-3). */
export function TablaHistorico({ resultado, filtros }: Props) {
  const { pagina, total, totalPaginas, lecturas } = resultado;
  if (lecturas.length === 0) {
    return (
      <div className="space-y-3">
        <EstadoVacio titulo="No hay lecturas con estos filtros" icono="alarma">
          Cambia los filtros o el rango de días.
        </EstadoVacio>
        <div className="flex justify-end">
          <EnlaceExportar filtros={filtros} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <EnlaceExportar filtros={filtros} />
      </div>
      <div className="-mx-4 overflow-x-auto">
        <table className="tabla" data-testid="tabla-historico">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Nodo</th>
              <th>Sensor</th>
              <th>Voltaje</th>
              <th>Corriente</th>
              <th>Potencia</th>
            </tr>
          </thead>
          <tbody>
            {lecturas.map((l) => (
              <tr key={l.id} data-testid="lectura-historico">
                <td className="cifra text-tenue">{formatearFecha(l.tomadaEn)}</td>
                <td>{l.nodoNombre}</td>
                <td className="font-medium">{l.sensorNombre}</td>
                <td className="cifra">{formatoTension(l.voltaje)}</td>
                <td className="cifra">{formatoCorriente(l.corriente)}</td>
                <td className="cifra">{formatoPotencia(l.potencia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Páginas del histórico" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-tenue">
          <span data-testid="historico-total" className="cifra text-texto">
            {total}
          </span>{" "}
          lecturas · <span data-testid="historico-pagina">{`Página ${pagina} de ${totalPaginas}`}</span>
        </p>
        <div className="flex gap-4">
          {pagina > 1 && (
            <a data-testid="pagina-anterior" href={enlacePagina(filtros, pagina - 1)} className="enlace">
              Anterior
            </a>
          )}
          {pagina < totalPaginas && (
            <a data-testid="pagina-siguiente" href={enlacePagina(filtros, pagina + 1)} className="enlace">
              Siguiente
            </a>
          )}
        </div>
      </nav>
    </div>
  );
}
