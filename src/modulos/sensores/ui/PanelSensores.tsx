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
        <p className="text-tenue">Este nodo aún no tiene sensores.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Sensor</th>
                <th>Umbral de voltaje</th>
                <th>Umbral de corriente</th>
                <th>Umbral de potencia</th>
                <th>Última lectura</th>
              </tr>
            </thead>
            <tbody>
              {sensores.map((sensor) => (
                <tr key={sensor.id}>
                  <td className="font-medium">{sensor.nombre}</td>
                  <td className="cifra">{umbral(sensor.umbralVoltaje, "V")}</td>
                  <td className="cifra">{umbral(sensor.umbralCorriente, "A")}</td>
                  <td className="cifra">{umbral(sensor.umbralPotencia, "W")}</td>
                  <td className="cifra text-tenue" data-testid="ultima-lectura">
                    {lectura(sensor.ultimaLectura)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Ocultar el formulario es cosmético: la API verifica el rol. */}
      {sesion?.rol === "administrador" && <FormularioSensor nodoId={nodoId} />}
    </div>
  );
}
