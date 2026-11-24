import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { obtenerTopologia } from "@/modulos/topologia/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/topologia", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await obtenerTopologia());
});
