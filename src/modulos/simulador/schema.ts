import { z } from "zod";

/** El simulador actúa sobre el nodo indicado en el cuerpo, que es obligatorio (decisión #10). */
export const simularSchema = z.object({ nodoId: z.guid() });

export type SimularEntrada = z.infer<typeof simularSchema>;
