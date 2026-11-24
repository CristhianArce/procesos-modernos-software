import "server-only";
import { db } from "@/lib/db";
import type { Magnitud } from "@/modulos/alertas/magnitudes";

export type Notificacion = {
  id: string;
  sensor: string;
  magnitud: Magnitud;
  valor: number;
  creadaEn: string;
  leida: boolean;
};
export type NotificacionNueva = Omit<Notificacion, "id" | "leida"> & { destinatarioId: string; leida?: boolean };

export const LIMITE_NOTIFICACIONES = 50;

type Fila = { id: string; sensor: string; magnitud: Magnitud; valor: number; creada_en: Date; leida: boolean };

const COLUMNAS = "id, sensor, magnitud, valor, creada_en, leida";
const aNotificacion = (f: Fila): Notificacion => ({
  id: f.id,
  sensor: f.sensor,
  magnitud: f.magnitud,
  valor: f.valor,
  creadaEn: f.creada_en.toISOString(),
  leida: f.leida,
});

/** Las más recientes del destinatario, de la más reciente a la más antigua. */
export async function recientesDe(destinatarioId: string): Promise<Notificacion[]> {
  const { rows } = await db().query<Fila>(
    `SELECT ${COLUMNAS} FROM notificaciones WHERE destinatario_id = $1
     ORDER BY creada_en DESC, id DESC LIMIT $2`,
    [destinatarioId, LIMITE_NOTIFICACIONES],
  );
  return rows.map(aNotificacion);
}

/** Todas las no leídas del destinatario, también las que pasan del límite de la lista. */
export async function contarNoLeidas(destinatarioId: string): Promise<number> {
  const { rows } = await db().query<{ total: number }>(
    "SELECT count(*)::int AS total FROM notificaciones WHERE destinatario_id = $1 AND NOT leida",
    [destinatarioId],
  );
  return rows[0].total;
}

/** La usan las pruebas y la HU 12; esta historia solo consulta. */
export async function insertar(n: NotificacionNueva): Promise<Notificacion> {
  const { rows } = await db().query<Fila>(
    `INSERT INTO notificaciones (destinatario_id, sensor, magnitud, valor, creada_en, leida)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNAS}`,
    [n.destinatarioId, n.sensor, n.magnitud, n.valor, n.creadaEn, n.leida ?? false],
  );
  return aNotificacion(rows[0]);
}
