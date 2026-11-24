import "server-only";
import { db } from "@/lib/db";

/** Alias ficticio que depende de un nodo (RN-3). */
export type Afectado = { id: string; alias: string };

/** Afectados del nodo, por alias y, entre alias repetidos, por id (decisión #1). */
export async function listarPorNodo(nodoId: string): Promise<Afectado[]> {
  const { rows } = await db().query<Afectado>("SELECT id, alias FROM nodo_usuarios WHERE nodo_id = $1 ORDER BY alias, id", [nodoId]);
  return rows;
}

/** Guarda un afectado en el nodo; el alias puede repetirse (RN-4). */
export async function crear(nodoId: string, alias: string): Promise<Afectado> {
  const { rows } = await db().query<Afectado>("INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, $2) RETURNING id, alias", [nodoId, alias]);
  return rows[0];
}
