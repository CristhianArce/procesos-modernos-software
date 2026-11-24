import "server-only";
import { db } from "@/lib/db";
import type { EstadoNodo } from "@/modulos/nodos/repo";

export type CambioEstado = { id: string; estado: EstadoNodo };

/**
 * Pone el estado del nodo y devuelve el resultado, o null si el nodo no existe.
 * Es la única escritura de esta historia sobre una tabla de la HU 4, y toca solo la columna `estado` (RN-5).
 */
export async function cambiarEstado(id: string, estado: EstadoNodo): Promise<CambioEstado | null> {
  const { rows } = await db().query<CambioEstado>("UPDATE nodos SET estado = $2 WHERE id = $1 RETURNING id, estado", [id, estado]);
  return rows[0] ?? null;
}
