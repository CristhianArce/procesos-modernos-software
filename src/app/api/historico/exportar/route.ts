import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { ROLES } from "@/lib/session";
import { filtrosHistoricoSchema } from "@/modulos/historico/schema";
import { exportarHistorico } from "@/modulos/historico/service";

export const dynamic = "force-dynamic";

// Mismos filtros que /api/historico, sin paginar; el CSV es un adjunto y no se guarda en caché (decisión #3).
export const GET = conHttp("/api/historico/exportar", async (req) => {
  requireRole(await sessionFromRequest(req), ...ROLES);
  const filtros = filtrosHistoricoSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return new Response(await exportarHistorico(filtros), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="historico.csv"',
      "Cache-Control": "no-store",
    },
  });
});
