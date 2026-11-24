import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { eliminarEnlace } from "@/modulos/topologia/service";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export const DELETE = conHttp<Contexto>("/api/topologia/enlaces/[id]", async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  await eliminarEnlace((await params).id);
  return new Response(null, { status: 204 });
});
