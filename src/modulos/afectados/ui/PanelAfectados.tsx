import { Suspense } from "react";
import { logger } from "@/lib/logger";
import { Cargando } from "@/modulos/ui/Cargando";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { listarAfectados, type AfectadosNodo } from "../service";
import { ListaAfectados } from "./ListaAfectados";

async function AfectadosDelNodo({ nodoId }: { nodoId: string }) {
  let datos: AfectadosNodo;
  try {
    datos = await listarAfectados(nodoId);
  } catch (error) {
    logger.error({ err: error, nodoId }, "no se pudieron cargar los afectados");
    return <EstadoError titulo="No se pudieron cargar los afectados" />;
  }
  return <ListaAfectados total={datos.total} afectados={datos.afectados} />;
}

/** Panel de la ficha del nodo: solo lectura para administrador y técnico (CA-1, CA-2; decisión #5). */
export function PanelAfectados({ nodoId }: { nodoId: string }) {
  return (
    <Suspense fallback={<Cargando etiqueta="Cargando afectados…" />}>
      <AfectadosDelNodo nodoId={nodoId} />
    </Suspense>
  );
}
