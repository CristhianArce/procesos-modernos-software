import "server-only";
import * as repo from "./repo";
import type { RespuestaNotificaciones } from "./schema";

/** Las notificaciones del usuario recibido; el destinatario nunca viene del cliente (CA-1, CA-2, RN-3). */
export const consultar = (usuarioId: string): Promise<RespuestaNotificaciones> => repo.listarDeUsuario(usuarioId);
