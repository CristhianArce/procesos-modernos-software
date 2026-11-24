import "server-only";
import { db } from "@/lib/db";
import type { Magnitud } from "@/modulos/alertas/magnitudes";
import type { Notificacion } from "./tipos";

type Fila = { id: string; sensor_nombre: string; magnitud: Magnitud; valor: number; alerta_creada_en: Date; leida: boolean };

const aNotificacion = (f: Fila): Notificacion => ({
  id: f.id,
  sensor: f.sensor_nombre,
  magnitud: f.magnitud,
  valor: f.valor,
  fecha: f.alerta_creada_en.toISOString(),
  leida: f.leida,
});

/** Las del usuario, de la más reciente a la más antigua; en empate de fecha, el id mayor primero (decisión #2). */
export async function listarDeUsuario(usuarioId: string, limite: number): Promise<Notificacion[]> {
  const { rows } = await db().query<Fila>(
    `SELECT id, sensor_nombre, magnitud, valor, alerta_creada_en, leida FROM notificaciones
     WHERE usuario_id = $1 ORDER BY alerta_creada_en DESC, id DESC LIMIT $2`,
    [usuarioId, limite],
  );
  return rows.map(aNotificacion);
}

/** Todas las no leídas del usuario, no solo las listadas. */
export async function contarNoLeidas(usuarioId: string): Promise<number> {
  const { rows } = await db().query<{ total: number }>(
    "SELECT count(*)::int AS total FROM notificaciones WHERE usuario_id = $1 AND NOT leida",
    [usuarioId],
  );
  return rows[0].total;
}
