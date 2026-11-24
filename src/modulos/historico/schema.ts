import { z } from "zod";

/** Un parámetro vacío de la URL (`desde=`) cuenta como ausente. */
const opcional = <T extends z.ZodType>(esquema: T) => z.preprocess((v) => (v === "" ? undefined : v), esquema.optional());

/**
 * Filtros del histórico (`GET /api/historico`), reutilizables por la exportación a CSV.
 * Las fechas son ISO 8601 con zona y los extremos del rango son inclusivos (decisiones #1 y #6).
 */
export const historicoFiltrosSchema = z
  .object({
    nodoId: opcional(z.guid()),
    sensorId: opcional(z.guid()),
    desde: opcional(z.iso.datetime({ offset: true })),
    hasta: opcional(z.iso.datetime({ offset: true })),
    pagina: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).default(1)),
  })
  .refine((f) => !f.desde || !f.hasta || Date.parse(f.desde) <= Date.parse(f.hasta), {
    message: "La fecha inicial no puede ser posterior a la final",
    path: ["desde"],
  });

export type HistoricoFiltros = z.infer<typeof historicoFiltrosSchema>;
