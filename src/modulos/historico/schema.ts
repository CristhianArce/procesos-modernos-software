import { z } from "zod";

/** Lecturas por página (RN-2, decisión 1 del issue). */
export const POR_PAGINA = 25;

// El formulario GET envía "" en los filtros sin elegir: se tratan como ausentes (decisión #8).
const sinVacios = (valor: unknown) =>
  valor && typeof valor === "object" ? Object.fromEntries(Object.entries(valor).filter(([, v]) => v !== "" && v !== undefined)) : valor;

const camposFiltro = {
  nodoId: z.guid().optional(),
  sensorId: z.guid().optional(),
  desde: z.iso.date().optional(),
  hasta: z.iso.date().optional(),
};

// AAAA-MM-DD se compara como texto; desde igual a hasta es válido (decisión #2).
const rangoValido = (f: { desde?: string; hasta?: string }) => !f.desde || !f.hasta || f.desde <= f.hasta;
const RANGO = { message: "La fecha inicial no puede ser posterior a la final", path: ["desde"] };

/** Filtros del histórico; los reutiliza la HU 16 (decisión #10). */
export const filtrosHistoricoSchema = z.preprocess(sinVacios, z.object(camposFiltro).refine(rangoValido, RANGO));

/** Filtros más la página (decisión #5). */
export const consultaHistoricoSchema = z.preprocess(
  sinVacios,
  z.object({ ...camposFiltro, pagina: z.coerce.number().int().min(1).default(1) }).refine(rangoValido, RANGO),
);

export type FiltrosHistorico = z.infer<typeof filtrosHistoricoSchema>;
export type ConsultaHistorico = z.infer<typeof consultaHistoricoSchema>;
