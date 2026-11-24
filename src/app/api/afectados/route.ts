import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { afectadosConsultaSchema } from "@/modulos/afectados/schema";
import { listarAfectados } from "@/modulos/afectados/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/afectados", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const { nodoId } = afectadosConsultaSchema.parse({ nodoId: new URL(req.url).searchParams.get("nodoId") ?? undefined });
  return Response.json(await listarAfectados(nodoId));
});
