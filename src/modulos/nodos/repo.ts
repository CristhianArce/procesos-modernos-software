import "server-only";
import { db } from "@/lib/db";
import type { NodoCrear, NodoEditar } from "./schema";

export type EstadoNodo = "conectado" | "desconectado";
export type Nodo = { id: string; nombre: string; ubicacion: string | null; estado: EstadoNodo; creadoEn: string };

type Fila = { id: string; nombre: string; ubicacion: string | null; estado: EstadoNodo; creado_en: Date };

const COLUMNAS = "id, nombre, ubicacion, estado, creado_en";
const aNodo = (f: Fila): Nodo => ({ id: f.id, nombre: f.nombre, ubicacion: f.ubicacion, estado: f.estado, creadoEn: f.creado_en.toISOString() });

export async function crear({ nombre, ubicacion }: NodoCrear): Promise<Nodo> {
  const { rows } = await db().query<Fila>(`INSERT INTO nodos (nombre, ubicacion) VALUES ($1, $2) RETURNING ${COLUMNAS}`, [
    nombre,
    ubicacion ?? null,
  ]);
  return aNodo(rows[0]);
}

export async function listar(): Promise<Nodo[]> {
  const { rows } = await db().query<Fila>(`SELECT ${COLUMNAS} FROM nodos ORDER BY creado_en, id`);
  return rows.map(aNodo);
}

export async function buscar(id: string): Promise<Nodo | null> {
  const { rows } = await db().query<Fila>(`SELECT ${COLUMNAS} FROM nodos WHERE id = $1`, [id]);
  return rows[0] ? aNodo(rows[0]) : null;
}

/** Cambia solo los campos enviados; `ubicacion: null` la borra. Devuelve null si el nodo no existe. */
export async function actualizar(id: string, cambios: NodoEditar): Promise<Nodo | null> {
  const { rows } = await db().query<Fila>(
    `UPDATE nodos SET nombre = COALESCE($2, nombre), ubicacion = CASE WHEN $3 THEN $4 ELSE ubicacion END
     WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id, cambios.nombre ?? null, cambios.ubicacion !== undefined, cambios.ubicacion ?? null],
  );
  return rows[0] ? aNodo(rows[0]) : null;
}

/** Elimina el nodo y, en cascada, sus sensores y lecturas (decisión #5). Devuelve si existía. */
export async function eliminar(id: string): Promise<boolean> {
  const { rowCount } = await db().query("DELETE FROM nodos WHERE id = $1", [id]);
  return rowCount === 1;
}
