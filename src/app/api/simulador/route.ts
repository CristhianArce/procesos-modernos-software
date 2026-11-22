import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { simularSchema } from "@/modulos/simulador/schema";
import { simular } from "@/modulos/simulador/service";

export const dynamic = "force-dynamic";

// Solo el administrador simula (decisión #11).
export const POST = conHttp("/api/simulador", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const { nodoId } = simularSchema.parse(await req.json().catch(() => undefined));
  return Response.json({ lecturas: await simular(nodoId) });
});
