import "server-only";
import { db } from "@/lib/db";
import type { Magnitud } from "@/modulos/alertas/magnitudes";
import type { Notificacion, RespuestaNotificaciones } from "./schema";

/** Tope de la lista: sin paginación todavía (YAGNI); `noLeidas` cuenta todas las del usuario. */
export const MAXIMO_NOTIFICACIONES = 100;

type Fila = { id: string; sensor_nombre: string; magnitud: Magnitud; valor: number; alerta_creada_en: Date; leida: boolean };

const aNotificacion = (f: Fila): Notificacion => ({
  id: f.id,
  sensor: f.sensor_nombre,
  magnitud: f.magnitud,
  valor: f.valor,
  fecha: f.alerta_creada_en.toISOString(),
  leida: f.leida,
});

/** Las notificaciones del usuario, de la más reciente a la más antigua, y cuántas siguen sin leer (CA-1, CA-2). */
export async function listarDeUsuario(usuarioId: string): Promise<RespuestaNotificaciones> {
  const [lista, conteo] = await Promise.all([
    db().query<Fila>(
      `SELECT id, sensor_nombre, magnitud, valor, alerta_creada_en, leida FROM notificaciones
       WHERE usuario_id = $1 ORDER BY alerta_creada_en DESC, id DESC LIMIT $2`,
      [usuarioId, MAXIMO_NOTIFICACIONES],
    ),
    db().query<{ no_leidas: number }>("SELECT count(*)::int AS no_leidas FROM notificaciones WHERE usuario_id = $1 AND NOT leida", [usuarioId]),
  ]);
  return { notificaciones: lista.rows.map(aNotificacion), noLeidas: conteo.rows[0].no_leidas };
}
