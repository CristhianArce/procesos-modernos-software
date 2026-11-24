import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { afectadoCrearSchema } from "@/modulos/afectados/schema";
import { agregarAfectado } from "@/modulos/afectados/service";

export const dynamic = "force-dynamic";

export const POST = conHttp("/api/afectados", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const entrada = afectadoCrearSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await agregarAfectado(entrada), { status: 201 });
});
