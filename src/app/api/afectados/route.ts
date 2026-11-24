import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { afectadoCrearSchema, afectadosConsultaSchema } from "@/modulos/afectados/schema";
import { crearAfectado, listarAfectados } from "@/modulos/afectados/service";

export const dynamic = "force-dynamic";

const RUTA = "/api/afectados";

export const GET = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const { nodoId } = afectadosConsultaSchema.parse({ nodoId: new URL(req.url).searchParams.get("nodoId") ?? undefined });
  return Response.json(await listarAfectados(nodoId));
});

export const POST = conHttp(RUTA, async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const entrada = afectadoCrearSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await crearAfectado(entrada), { status: 201 });
});
