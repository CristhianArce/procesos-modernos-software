import { Suspense } from "react";
import { sesionActual } from "@/lib/dal";
import { logger } from "@/lib/logger";
import { Cargando } from "@/modulos/ui/Cargando";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { listarAfectados, type AfectadosNodo } from "../service";
import { FormularioAfectado } from "./FormularioAfectado";
import { ListaAfectados } from "./ListaAfectados";

async function AfectadosDelNodo({ nodoId }: { nodoId: string }) {
  let datos: AfectadosNodo;
  try {
    datos = await listarAfectados(nodoId);
  } catch (error) {
    logger.error({ err: error, nodoId }, "no se pudieron cargar los afectados");
    return <EstadoError titulo="No se pudieron cargar los afectados" />;
  }
  const sesion = await sesionActual();
  return (
    <>
      <ListaAfectados total={datos.total} afectados={datos.afectados} />
      {/* Ocultar el formulario es cosmético: la API verifica el rol (CA-4). */}
      {sesion?.rol === "administrador" && <FormularioAfectado nodoId={nodoId} />}
    </>
  );
}

/** Panel de la ficha del nodo: lista y total para todos; el administrador además agrega (CA-1, CA-2, CA-4; decisión #5). */
export function PanelAfectados({ nodoId }: { nodoId: string }) {
  return (
    <Suspense fallback={<Cargando etiqueta="Cargando afectados…" />}>
      <AfectadosDelNodo nodoId={nodoId} />
    </Suspense>
  );
}
