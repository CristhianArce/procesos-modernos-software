import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { consultar } from "@/modulos/notificaciones/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/notificaciones", async (req) => {
  const sesion = requireRole(await sessionFromRequest(req), "tecnico");
  return Response.json(await consultar(sesion.sub));
});
