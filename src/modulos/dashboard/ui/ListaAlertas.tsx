import type { Alerta } from "@/modulos/alertas/repo";
import { conUnidad, formatearFecha } from "../formato";

/** Alertas en el orden recibido: la más reciente primero (CA-4). */
export function ListaAlertas({ alertas, nombres }: { alertas: Alerta[]; nombres: Map<string, string> }) {
  if (alertas.length === 0) return <p className="mt-2 text-gray-600">Sin alertas</p>;
  return (
    <table className="mt-2 w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-2">Fecha</th>
          <th className="py-2">Sensor</th>
          <th className="py-2">Magnitud</th>
          <th className="py-2">Valor</th>
          <th className="py-2">Umbral</th>
        </tr>
      </thead>
      <tbody>
        {alertas.map((a) => (
          <tr key={a.id} data-testid="alerta" className="border-b border-gray-100">
            <td className="py-2">{formatearFecha(a.creadaEn)}</td>
            <td className="py-2">{nombres.get(a.sensorId) ?? "—"}</td>
            <td className="py-2">{a.magnitud}</td>
            <td className="py-2">{conUnidad(a.valor, a.magnitud)}</td>
            <td className="py-2">{conUnidad(a.umbral, a.magnitud)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
