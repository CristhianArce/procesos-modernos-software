import "server-only";
import * as repo from "./repo";
import type { Notificacion } from "./repo";

export type CentroNotificaciones = { noLeidas: number; notificaciones: Notificacion[] };

/** Las notificaciones del destinatario y cuántas están sin leer (CA-1, CA-2). */
export async function consultarNotificaciones(destinatarioId: string): Promise<CentroNotificaciones> {
  const [notificaciones, noLeidas] = await Promise.all([repo.recientesDe(destinatarioId), repo.contarNoLeidas(destinatarioId)]);
  return { noLeidas, notificaciones };
}
