import { sesionActual } from "@/lib/dal";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { listarAfectados } from "../service";
import { FormularioAfectado } from "./FormularioAfectado";

/** Panel de la ficha del nodo: lista y total de afectados y, para el administrador, el alta (CA-1, CA-4). */
export async function PanelAfectados({ nodoId }: { nodoId: string }) {
  const [sesion, afectados] = await Promise.all([sesionActual(), listarAfectados(nodoId)]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-tenue">
        Total: <span className="cifra" data-testid="total-afectados">{afectados.length}</span>
      </p>
      {afectados.length === 0 ? (
        <EstadoVacio titulo="Sin afectados">Este nodo aún no tiene afectados registrados.</EstadoVacio>
      ) : (
        <ul data-testid="lista-afectados" className="divide-y divide-borde">
          {afectados.map((a) => (
            <li key={a.id} className="py-2">
              {a.alias}
            </li>
          ))}
        </ul>
      )}
      {/* Ocultar el formulario es cosmético: la API verifica el rol. */}
      {sesion?.rol === "administrador" && <FormularioAfectado nodoId={nodoId} />}
    </div>
  );
}
