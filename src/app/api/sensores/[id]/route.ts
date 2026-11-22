import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { sensorEditarSchema } from "@/modulos/sensores/schema";
import { editarSensor, eliminarSensor, obtenerSensor } from "@/modulos/sensores/service";

export const dynamic = "force-dynamic";

const RUTA = "/api/sensores/[id]";
type Contexto = { params: Promise<{ id: string }> };

export const GET = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  return Response.json(await obtenerSensor((await params).id));
});

export const PATCH = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const cambios = sensorEditarSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await editarSensor((await params).id, cambios));
});

export const DELETE = conHttp<Contexto>(RUTA, async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  await eliminarSensor((await params).id);
  return new Response(null, { status: 204 });
});
