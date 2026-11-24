import "server-only";
import { db } from "@/lib/db";
import type { EstadoNodo } from "@/modulos/nodos/repo";
import type { EnlaceCrear, Posicion, TipoNodo } from "./schema";

/** Un nodo sin posición guardada trae `tipo`, `x` e `y` nulos. */
export type NodoTopologia = { id: string; nombre: string; estado: EstadoNodo; tipo: TipoNodo | null; x: number | null; y: number | null };
export type PosicionGuardada = Posicion & { nodoId: string };
export type Enlace = { id: string; origenId: string; destinoId: string };

type FilaEnlace = { id: string; origen_id: string; destino_id: string };
const aEnlace = (f: FilaEnlace): Enlace => ({ id: f.id, origenId: f.origen_id, destinoId: f.destino_id });

export async function listarNodos(): Promise<NodoTopologia[]> {
  const { rows } = await db().query<NodoTopologia>(
    `SELECT n.id, n.nombre, n.estado, t.tipo, t.x, t.y
     FROM nodos n LEFT JOIN nodo_topologia t ON t.nodo_id = n.id
     ORDER BY n.creado_en, n.id`,
  );
  return rows;
}

export async function listarEnlaces(): Promise<Enlace[]> {
  const { rows } = await db().query<FilaEnlace>("SELECT id, origen_id, destino_id FROM enlaces ORDER BY creado_en, id");
  return rows.map(aEnlace);
}

/** Crea o reemplaza la posición del nodo. */
export async function guardarPosicion(nodoId: string, { tipo, x, y }: Posicion): Promise<PosicionGuardada> {
  const { rows } = await db().query<{ nodo_id: string; tipo: TipoNodo; x: number; y: number }>(
    `INSERT INTO nodo_topologia (nodo_id, tipo, x, y) VALUES ($1, $2, $3, $4)
     ON CONFLICT (nodo_id) DO UPDATE SET tipo = EXCLUDED.tipo, x = EXCLUDED.x, y = EXCLUDED.y, actualizado_en = now()
     RETURNING nodo_id, tipo, x, y`,
    [nodoId, tipo, x, y],
  );
  const f = rows[0];
  return { nodoId: f.nodo_id, tipo: f.tipo, x: f.x, y: f.y };
}

/** null si ya existe un enlace entre ese par de nodos, en cualquier sentido (índice único enlaces_par_idx). */
export async function crearEnlace({ origenId, destinoId }: EnlaceCrear): Promise<Enlace | null> {
  const { rows } = await db().query<FilaEnlace>(
    "INSERT INTO enlaces (origen_id, destino_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id, origen_id, destino_id",
    [origenId, destinoId],
  );
  return rows[0] ? aEnlace(rows[0]) : null;
}

export async function eliminarEnlace(id: string): Promise<boolean> {
  const { rowCount } = await db().query("DELETE FROM enlaces WHERE id = $1", [id]);
  return rowCount === 1;
}
