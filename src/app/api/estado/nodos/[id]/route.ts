import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { detalleNodo } from "@/modulos/estado/service";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export const GET = conHttp<Contexto>("/api/estado/nodos/[id]", async (req, { params }) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await detalleNodo((await params).id), { headers: { "Cache-Control": "no-store" } });
});
