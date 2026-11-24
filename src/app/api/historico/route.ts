import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { historicoFiltrosSchema } from "@/modulos/historico/schema";
import { consultarHistorico } from "@/modulos/historico/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/historico", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const filtros = historicoFiltrosSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await consultarHistorico(filtros));
});
