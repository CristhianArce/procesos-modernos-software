import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { sensorCrearSchema, sensoresConsultaSchema } from "@/modulos/sensores/schema";
import { crearSensor, listarSensores } from "@/modulos/sensores/service";

export const dynamic = "force-dynamic";

const RUTA = "/api/sensores";

export const GET = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const { nodoId } = sensoresConsultaSchema.parse({ nodoId: new URL(req.url).searchParams.get("nodoId") ?? undefined });
  return Response.json(await listarSensores(nodoId));
});

export const POST = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const entrada = sensorCrearSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await crearSensor(entrada), { status: 201 });
});
