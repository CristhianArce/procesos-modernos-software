import Link from "next/link";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";

export default function NodoNoEncontrado() {
  return (
    <EstadoVacio
      titulo="Nodo no encontrado"
      accion={
        <Link href="/nodos" className="enlace text-sm font-medium">
          Volver a la lista de nodos
        </Link>
      }
    >
      El nodo no existe o fue eliminado.
    </EstadoVacio>
  );
}
