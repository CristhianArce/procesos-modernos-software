import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { lecturasConsultaSchema } from "@/modulos/lecturas/schema";
import { listarLecturas } from "@/modulos/lecturas/service";

export const dynamic = "force-dynamic";

export const GET = conHttp("/api/lecturas", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const consulta = lecturasConsultaSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await listarLecturas(consulta));
});
