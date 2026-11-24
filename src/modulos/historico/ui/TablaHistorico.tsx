import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import type { FilaHistorico } from "../tipos";

const fechaHora = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "medium" });

/** Tabla de lecturas de una página del histórico; sin lecturas muestra el estado vacío (CA-3). */
export function TablaHistorico({ filas }: { filas: FilaHistorico[] }) {
  if (filas.length === 0) {
    return (
      <div data-testid="historico-vacio">
        <EstadoVacio titulo="Sin lecturas">Ninguna lectura cumple los filtros elegidos.</EstadoVacio>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="tabla" data-testid="historico-tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nodo</th>
            <th>Sensor</th>
            <th className="text-right">Voltaje</th>
            <th className="text-right">Corriente</th>
            <th className="text-right">Potencia</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((l) => (
            <tr key={l.id} data-testid="fila-historico">
              <td className="cifra whitespace-nowrap">{fechaHora.format(new Date(l.tomadaEn))}</td>
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
