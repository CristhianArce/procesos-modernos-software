import { z } from "zod";

/** Parámetros de `GET /api/afectados`: un id mal formado es 400 (decisión #3). */
export const afectadosConsultaSchema = z.object({ nodoId: z.guid() });

/** Cuerpo de `POST /api/afectados`: alias recortado de 1 a 80 caracteres, como el CHECK de la tabla (CA-2; decisión #1). */
export const afectadoCrearSchema = z.object({ nodoId: z.guid(), alias: z.string().trim().min(1).max(80) });

export type AfectadoCrear = z.infer<typeof afectadoCrearSchema>;
