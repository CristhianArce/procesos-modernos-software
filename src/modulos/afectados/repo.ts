import "server-only";
import { db } from "@/lib/db";

export type Afectado = { id: string; alias: string; creadoEn: string };

type Fila = { id: string; alias: string; creado_en: Date };

/** Afectados del nodo en orden de creación (decisión #1); los alias repetidos aparecen cada uno (RN-4). */
export async function listarPorNodo(nodoId: string): Promise<Afectado[]> {
  const { rows } = await db().query<Fila>(
    "SELECT id, alias, creado_en FROM nodo_usuarios WHERE nodo_id = $1 ORDER BY creado_en, id",
    [nodoId],
  );
  return rows.map((f) => ({ id: f.id, alias: f.alias, creadoEn: f.creado_en.toISOString() }));
}
