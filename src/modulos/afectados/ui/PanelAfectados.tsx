import { listarAfectados } from "../service";
import { ListaAfectados } from "./ListaAfectados";

/** Panel de la ficha del nodo: administrador y técnico ven lo mismo (CA-2). */
export async function PanelAfectados({ nodoId }: { nodoId: string }) {
  return <ListaAfectados {...await listarAfectados(nodoId)} />;
}
