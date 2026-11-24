import { z } from "zod";

/** Alias obligatorio, sin espacios en los extremos, de 1 a 100 caracteres (decisión #1). */
export const afectadoCrearSchema = z.object({ nodoId: z.guid(), alias: z.string().trim().min(1).max(100) });

export type AfectadoCrear = z.infer<typeof afectadoCrearSchema>;
