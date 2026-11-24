import { z } from "zod";

/** Los únicos estados de un nodo (RN-1). */
export const cambiarEstadoSchema = z.object({ estado: z.enum(["conectado", "desconectado"]) });

export type CambiarEstado = z.infer<typeof cambiarEstadoSchema>;
