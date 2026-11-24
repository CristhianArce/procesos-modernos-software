import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { asignarTecnicoSchema } from "@/modulos/mantenimiento/schema";
import { asignarTecnico } from "@/modulos/mantenimiento/service";

export const dynamic = "force-dynamic";

// Solo el administrador asigna; el rol se comprueba antes de leer el cuerpo (CA-4).
export const PUT = conHttp<{ params: Promise<{ id: string }> }>("/api/mantenimiento/nodos/[id]/tecnico", async (req, { params }) => {
  requireRole(await sessionFromRequest(req), "administrador");
  const { tecnicoId } = asignarTecnicoSchema.parse(await req.json().catch(() => undefined));
  return Response.json(await asignarTecnico((await params).id, tecnicoId));
});
