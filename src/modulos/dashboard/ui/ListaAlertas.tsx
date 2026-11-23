import type { Alerta } from "@/modulos/alertas/repo";
import { conUnidad, formatearFecha } from "../formato";

/** Alertas en el orden recibido: la más reciente primero (CA-4). */
export function ListaAlertas({ alertas, nombres }: { alertas: Alerta[]; nombres: Map<string, string> }) {
  if (alertas.length === 0) return <p className="text-tenue">Sin alertas</p>;
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Sensor</th>
            <th>Magnitud</th>
            <th>Valor</th>
            <th>Umbral</th>
          </tr>
        </thead>
        <tbody>
          {alertas.map((a) => (
            <tr key={a.id} data-testid="alerta">
              <td className="cifra whitespace-nowrap text-tenue">{formatearFecha(a.creadaEn)}</td>
              <td>{nombres.get(a.sensorId) ?? "—"}</td>
              <td>{a.magnitud}</td>
              <td className="cifra text-critico">{conUnidad(a.valor, a.magnitud)}</td>
              <td className="cifra text-tenue">{conUnidad(a.umbral, a.magnitud)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
