import { formatearFecha } from "@/modulos/dashboard/formato";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import type { LecturaHistorico } from "../repo";

/** Lecturas del histórico en el orden recibido; sin ninguna, un estado vacío con texto. */
export function TablaHistorico({ items }: { items: LecturaHistorico[] }) {
  if (items.length === 0) {
    return <EstadoVacio titulo="Sin lecturas" icono="buscar">Ninguna lectura cumple los filtros aplicados.</EstadoVacio>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="tabla">
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
          {items.map((l) => (
            <tr key={l.id} data-testid="fila-lectura">
              <td className="whitespace-nowrap">{formatearFecha(l.tomadaEn)}</td>
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
