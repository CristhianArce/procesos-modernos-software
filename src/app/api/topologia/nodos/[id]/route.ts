import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { posicionSchema } from "@/modulos/topologia/schema";
import { posicionarNodo } from "@/modulos/topologia/service";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ id: string }> };

export const PUT = conHttp<Contexto>("/api/topologia/nodos/[id]", async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const posicion = posicionSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await posicionarNodo((await params).id, posicion));
});
