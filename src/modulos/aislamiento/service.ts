import "server-only";
import { ErrorHttp } from "@/lib/errores";
import { esUuid } from "@/modulos/nodos/schema";
import * as repo from "./repo";
import type { CambioEstado } from "./repo";

/** Aislar o reconectar un nodo. Pedir el estado que ya tiene responde igual y no cambia nada. */
export async function cambiarEstadoNodo(id: string, estado: CambioEstado["estado"]): Promise<CambioEstado> {
  const cambio = esUuid(id) ? await repo.cambiarEstado(id, estado) : null;
  if (!cambio) throw new ErrorHttp(404, "Nodo no encontrado");
  return cambio;
}
