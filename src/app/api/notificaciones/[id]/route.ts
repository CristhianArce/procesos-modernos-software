import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { idNotificacionSchema } from "@/modulos/notificaciones/schema";
import { marcarComoLeida } from "@/modulos/notificaciones/service";

export const dynamic = "force-dynamic";

// Solo técnicos (RN-2): la sesión y el rol se comprueban antes de validar el id. El destinatario sale de la
// sesión (RN-1) y el cuerpo no se lee: la única operación es marcar como leída.
export const PATCH = conHttp<{ params: Promise<{ id: string }> }>("/api/notificaciones/[id]", async (req, { params }) => {
  const sesion = requireRole(await sessionFromRequest(req), "tecnico");
  const { id } = idNotificacionSchema.parse({ id: (await params).id });
  return Response.json(await marcarComoLeida(id, sesion.sub));
});
