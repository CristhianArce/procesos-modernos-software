import "server-only";
import { db } from "@/lib/db";
import type { AfectadoCrear } from "./schema";

export type Afectado = { id: string; nodoId: string; alias: string; creadoEn: string };

type Fila = { id: string; nodo_id: string; alias: string; creado_en: Date };

const COLUMNAS = "id, nodo_id, alias, creado_en";
const aAfectado = (f: Fila): Afectado => ({ id: f.id, nodoId: f.nodo_id, alias: f.alias, creadoEn: f.creado_en.toISOString() });

export async function crear(entrada: AfectadoCrear): Promise<Afectado> {
  const { rows } = await db().query<Fila>(`INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, $2) RETURNING ${COLUMNAS}`, [
    entrada.nodoId,
    entrada.alias,
  ]);
  return aAfectado(rows[0]);
}

export async function listarPorNodo(nodoId: string): Promise<Afectado[]> {
  const { rows } = await db().query<Fila>(`SELECT ${COLUMNAS} FROM nodo_usuarios WHERE nodo_id = $1 ORDER BY creado_en, id`, [nodoId]);
  return rows.map(aAfectado);
}
