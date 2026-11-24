import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import type { FilaHistorico } from "../repo";

/** `2026-11-24T15:20:00.000Z` → `2026-11-24 15:20:00 UTC`, el mismo formato de los filtros. */
export const fechaUtc = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;

/** Tabla de lecturas del histórico, en el orden en que llegan. */
export function TablaHistorico({ items }: { items: FilaHistorico[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabla" data-testid="tabla-historico">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nodo</th>
            <th>Sensor</th>
            <th className="text-right">Tensión</th>
            <th className="text-right">Corriente</th>
            <th className="text-right">Potencia</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id} data-testid="fila-historico">
              <td className="cifra whitespace-nowrap" data-testid="fecha-historico">
                {fechaUtc(l.tomadaEn)}
              </td>
              <td>{l.nodoNombre}</td>
              <td>{l.sensorNombre}</td>
              <td className="cifra text-right whitespace-nowrap">{formatoTension(l.voltaje)}</td>
              <td className="cifra text-right whitespace-nowrap">{formatoCorriente(l.corriente)}</td>
              <td className="cifra text-right whitespace-nowrap">{formatoPotencia(l.potencia)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
