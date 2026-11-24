import { Cargando } from "@/modulos/ui/Cargando";

// Mientras el dashboard lee la BD, el shell sigue visible y el contenido muestra un esqueleto. Solo aquí: un
// loading.tsx sobre /nodos/[id] haría que la ficha de un nodo inexistente respondiera 200 en vez de 404 (streaming).
export default function CargandoTablero() {
  return <Cargando />;
}
