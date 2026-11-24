import { z } from "zod";

/** Lecturas por página del histórico (RN-2). */
export const TAMANO_PAGINA = 25;

/**
 * Filtros de `GET /api/historico` (CA-2, CA-4). Las fechas son ISO 8601 en UTC (decisión #2) y el rango
 * incluye `desde` y excluye `hasta` (decisión #1). La HU 16 reutiliza este esquema para exportar.
 */
export const historicoFiltrosSchema = z
  .object({
    nodoId: z.guid().optional(),
    sensorId: z.guid().optional(),
    desde: z.iso.datetime().optional(),
    hasta: z.iso.datetime().optional(),
    pagina: z.coerce.number().int().min(1).max(1_000_000).default(1),
  })
  .refine((f) => !f.desde || !f.hasta || Date.parse(f.desde) <= Date.parse(f.hasta), {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["hasta"],
  });

export type HistoricoFiltros = z.infer<typeof historicoFiltrosSchema>;
