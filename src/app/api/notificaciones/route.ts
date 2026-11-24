import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { consultarNotificaciones } from "@/modulos/notificaciones/service";

export const dynamic = "force-dynamic";

// El destinatario sale de la sesión (RN-3): el handler no lee nada de la petición del cliente.
export const GET = conHttp("/api/notificaciones", async (req) => {
  const sesion = requireRole(await sessionFromRequest(req), "tecnico");
  return Response.json(await consultarNotificaciones(sesion.sub));
});
