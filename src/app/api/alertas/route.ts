import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { alertasConsultaSchema } from "@/modulos/alertas/schema";
import { listarAlertas } from "@/modulos/alertas/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/alertas", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const consulta = alertasConsultaSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await listarAlertas(consulta));
});
