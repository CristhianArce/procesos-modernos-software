import { z } from "zod";

/** Lecturas por página del histórico (RN-2). */
export const POR_PAGINA = 25;

/** Filtros del histórico: ids (RN-3) y fechas ISO 8601 en UTC (decisión #2). La HU 16 los reutiliza. */
export const filtrosBase = z.object({
  nodoId: z.guid().optional(),
  sensorId: z.guid().optional(),
  desde: z.iso.datetime().optional(),
  hasta: z.iso.datetime().optional(),
});

/** El rango no puede estar invertido; fechas iguales sí valen (decisión #1: extremos inclusivos). */
const rangoValido = (f: { desde?: string; hasta?: string }) => !f.desde || !f.hasta || Date.parse(f.desde) <= Date.parse(f.hasta);
const errorRango = { message: "La fecha inicial no puede ser posterior a la final", path: ["hasta"] };

export const filtrosHistoricoSchema = filtrosBase.refine(rangoValido, errorRango);

export const consultaHistoricoSchema = filtrosBase
  .extend({ pagina: z.coerce.number().int().min(1).default(1) })
  .refine(rangoValido, errorRango);

export type FiltrosHistorico = z.infer<typeof filtrosHistoricoSchema>;
export type ConsultaHistorico = z.infer<typeof consultaHistoricoSchema>;
