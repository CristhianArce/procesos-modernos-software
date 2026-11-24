import "server-only";
import { ErrorHttp } from "@/lib/errores";
import * as repo from "./repo";
import type { Notificacion } from "./repo";

export type CentroNotificaciones = { noLeidas: number; notificaciones: Notificacion[] };

/** Las notificaciones del destinatario y cuántas están sin leer (CA-1, CA-2). */
export async function consultarNotificaciones(destinatarioId: string): Promise<CentroNotificaciones> {
  const [notificaciones, noLeidas] = await Promise.all([repo.recientesDe(destinatarioId), repo.contarNoLeidas(destinatarioId)]);
  return { noLeidas, notificaciones };
}

export const NOTIFICACION_NO_ENCONTRADA = "Notificación no encontrada";

/** Marca como leída una notificación del destinatario; una ajena o inexistente responde 404 (HU 13, CA-1, CA-2). */
export async function marcarComoLeida(id: string, destinatarioId: string): Promise<Notificacion> {
  const notificacion = await repo.marcarLeida(id, destinatarioId);
  if (!notificacion) throw new ErrorHttp(404, NOTIFICACION_NO_ENCONTRADA);
  return notificacion;
}
