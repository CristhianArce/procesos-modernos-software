import { z } from "zod";

/** Parámetros de `GET /api/afectados` (decisión #3). */
export const afectadosConsultaSchema = z.object({ nodoId: z.guid() });
