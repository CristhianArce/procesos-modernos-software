import "server-only";
import { db } from "@/lib/db";
import type { Rol } from "@/lib/session";

export type Tecnico = { id: string; nombreUsuario: string };
export type UsuarioRol = Tecnico & { rol: Rol };

/** El técnico asignado al nodo, o null si no tiene (RN-3: como máximo uno). */
export async function tecnicoDeNodo(nodoId: string): Promise<Tecnico | null> {
  const { rows } = await db().query<Tecnico>(
    `SELECT u.id, u.nombre_usuario AS "nombreUsuario"
       FROM nodo_tecnicos t JOIN usuarios u ON u.id = t.tecnico_id
      WHERE t.nodo_id = $1`,
    [nodoId],
  );
  return rows[0] ?? null;
}

/** Usuarios con rol técnico, por nombre de usuario, para el selector del panel. */
export async function listarTecnicos(): Promise<Tecnico[]> {
  const { rows } = await db().query<Tecnico>(
    `SELECT id, nombre_usuario AS "nombreUsuario" FROM usuarios WHERE rol = 'tecnico' ORDER BY nombre_usuario`,
  );
  return rows;
}

export async function buscarUsuario(id: string): Promise<UsuarioRol | null> {
  const { rows } = await db().query<UsuarioRol>(`SELECT id, nombre_usuario AS "nombreUsuario", rol FROM usuarios WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Asigna el técnico al nodo; si ya tenía otro, lo reemplaza en la misma sentencia (RN-3, decisión #2). */
export async function asignar(nodoId: string, tecnicoId: string): Promise<void> {
  await db().query(
    `INSERT INTO nodo_tecnicos (nodo_id, tecnico_id) VALUES ($1, $2)
     ON CONFLICT (nodo_id) DO UPDATE SET tecnico_id = EXCLUDED.tecnico_id, asignado_en = now()`,
    [nodoId, tecnicoId],
  );
}
