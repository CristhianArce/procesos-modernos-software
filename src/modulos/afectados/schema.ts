import { z } from "zod";

/** Parámetros de `GET /api/afectados`: un id mal formado es 400 (decisión #3). */
export const afectadosConsultaSchema = z.object({ nodoId: z.guid() });
