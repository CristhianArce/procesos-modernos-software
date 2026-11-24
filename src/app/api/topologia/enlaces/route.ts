import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { enlaceCrearSchema } from "@/modulos/topologia/schema";
import { crearEnlace } from "@/modulos/topologia/service";

export const dynamic = "force-dynamic";

export const POST = conHttp("/api/topologia/enlaces", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const entrada = enlaceCrearSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await crearEnlace(entrada), { status: 201 });
});
