import { sesionActual } from "@/lib/dal";
import type { Lectura } from "@/modulos/lecturas/service";
import { listarSensores } from "../service";
import { FormularioSensor } from "./FormularioSensor";

const umbral = (valor: number | null, unidad: string) => (valor === null ? "—" : `${valor} ${unidad}`);

const lectura = (l: Lectura | null) =>
  l ? `${l.voltaje} V · ${l.corriente} A · ${l.potencia} W (${l.tomadaEn})` : "Sin lecturas";

/** Panel de la ficha del nodo: sus sensores con la última lectura y, para el administrador, el formulario. */
export async function PanelSensores({ nodoId }: { nodoId: string }) {
  const [sesion, sensores] = await Promise.all([sesionActual(), listarSensores(nodoId)]);

  return (
    <div>
      {sensores.length === 0 ? (
        <p className="mt-2 text-tenue">Este nodo aún no tiene sensores.</p>
      ) : (
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-borde">
              <th className="py-2">Sensor</th>
              <th className="py-2">Umbral de voltaje</th>
              <th className="py-2">Umbral de corriente</th>
              <th className="py-2">Umbral de potencia</th>
              <th className="py-2">Última lectura</th>
            </tr>
          </thead>
          <tbody>
            {sensores.map((sensor) => (
              <tr key={sensor.id} className="border-b border-borde/60">
                <td className="py-2">{sensor.nombre}</td>
                <td className="py-2">{umbral(sensor.umbralVoltaje, "V")}</td>
                <td className="py-2">{umbral(sensor.umbralCorriente, "A")}</td>
                <td className="py-2">{umbral(sensor.umbralPotencia, "W")}</td>
                <td className="py-2" data-testid="ultima-lectura">
                  {lectura(sensor.ultimaLectura)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Ocultar el formulario es cosmético: la API verifica el rol. */}
      {sesion?.rol === "administrador" && <FormularioSensor nodoId={nodoId} />}
    </div>
  );
}
