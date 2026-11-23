import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { instantaneaViva } from "@/modulos/estado/service";

export const dynamic = "force-dynamic";

// El cliente la consulta cada 2,5 s: nunca se guarda en caché (datos con sesión, CLAUDE.md §4).
export const GET = conHttp("/api/estado", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await instantaneaViva(), { headers: { "Cache-Control": "no-store" } });
});
