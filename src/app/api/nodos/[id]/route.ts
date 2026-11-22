import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { nodoEditarSchema } from "@/modulos/nodos/schema";
import { editarNodo, eliminarNodo, obtenerNodo } from "@/modulos/nodos/service";

export const dynamic = "force-dynamic";

const RUTA = "/api/nodos/[id]";
type Contexto = { params: Promise<{ id: string }> };

export const GET = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await obtenerNodo((await params).id));
});

export const PATCH = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const cambios = nodoEditarSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await editarNodo((await params).id, cambios));
});

export const DELETE = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  await eliminarNodo((await params).id);
  return new Response(null, { status: 204 });
});
