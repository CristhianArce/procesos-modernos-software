import { z } from "zod";

/** Cuerpo de la asignación: un `tecnicoId` mal formado es 400 de validación (decisión #3). */
export const asignarTecnicoSchema = z.object({ tecnicoId: z.guid() });

export type AsignarTecnico = z.infer<typeof asignarTecnicoSchema>;
