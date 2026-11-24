import { sesionActual } from "@/lib/dal";
import { buscarNodo } from "@/modulos/nodos/service";
import { ControlAislamiento } from "./ControlAislamiento";

/** Panel de la ficha del nodo: aislar o reconectar, solo para el administrador. Ocultarlo es cosmético: la API exige el rol (CA-3). */
export async function PanelAislamiento({ nodoId }: { nodoId: string }) {
  const sesion = await sesionActual();
  if (sesion?.rol !== "administrador") {
    return <p className="text-sm text-tenue">Solo un administrador puede aislar o reconectar nodos.</p>;
  }
  const nodo = await buscarNodo(nodoId);
  if (!nodo) return null;
  return <ControlAislamiento nodoId={nodo.id} estado={nodo.estado} />;
}
