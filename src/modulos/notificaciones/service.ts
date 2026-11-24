import { contarNoLeidas, listarDeUsuario } from "./repo";
import { LIMITE_NOTIFICACIONES, type CentroNotificaciones } from "./tipos";

export async function consultarNotificaciones(usuarioId: string): Promise<CentroNotificaciones> {
  const [notificaciones, noLeidas] = await Promise.all([listarDeUsuario(usuarioId, LIMITE_NOTIFICACIONES), contarNoLeidas(usuarioId)]);
  return { notificaciones, noLeidas };
}
