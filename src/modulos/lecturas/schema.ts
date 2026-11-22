import { z } from "zod";

/** Parámetros de las consultas de lo más reciente (`GET /api/lecturas` y `GET /api/alertas`; decisiones #2 y #8). */
export const consultaRecientesSchema = (limitePorDefecto: number) =>
  z.object({
    sensorId: z.guid().optional(),
    limite: z.coerce.number().int().min(1).max(100).default(limitePorDefecto),
  });

/** Las lecturas por defecto son 50, como la gráfica. */
export const lecturasConsultaSchema = consultaRecientesSchema(50);

export type ConsultaRecientes = z.infer<typeof lecturasConsultaSchema>;
