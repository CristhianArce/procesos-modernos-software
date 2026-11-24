import { Cargando } from "@/modulos/ui/Cargando";

// Mientras el histórico lee la BD, el shell sigue visible y el contenido muestra un esqueleto.
export default function CargandoHistorico() {
  return <Cargando />;
}
