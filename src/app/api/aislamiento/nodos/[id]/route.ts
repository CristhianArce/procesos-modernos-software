import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { cambiarEstadoSchema } from "@/modulos/aislamiento/schema";
import { cambiarEstadoNodo } from "@/modulos/aislamiento/service";

export const dynamic = "force-dynamic";

// Solo el administrador aísla o reconecta; el rol se comprueba antes de leer el cuerpo.
export const PATCH = conHttp<{ params: Promise<{ id: string }> }>("/api/aislamiento/nodos/[id]", async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const { estado } = cambiarEstadoSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await cambiarEstadoNodo((await params).id, estado));
});
