import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { nodoCrearSchema } from "@/modulos/nodos/schema";
import { crearNodo, listarNodos } from "@/modulos/nodos/service";

export const dynamic = "force-dynamic";

const RUTA = "/api/nodos";

export const GET = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await listarNodos());
});

export const POST = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  // Un cuerpo que no es JSON falla en Zod y responde 400, no 500 (CA-3).
  const entrada = nodoCrearSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await crearNodo(entrada), { status: 201 });
});
