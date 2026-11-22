import "server-only";
import { db } from "@/lib/db";
import type { Rol } from "@/lib/session";

export type Usuario = { id: string; nombreUsuario: string; contrasenaHash: string; rol: Rol };

export async function buscarPorNombre(nombreUsuario: string): Promise<Usuario | null> {
  const { rows } = await db().query(
    "SELECT id, nombre_usuario, contrasena_hash, rol FROM usuarios WHERE nombre_usuario = $1",
    [nombreUsuario],
  );
  if (rows.length === 0) return null;
  const fila = rows[0];
  return { id: fila.id, nombreUsuario: fila.nombre_usuario, contrasenaHash: fila.contrasena_hash, rol: fila.rol };
}
