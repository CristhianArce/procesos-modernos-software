import { z } from "zod";

export const acercaSchema = z.object({
  nombre: z.string().min(1),
  version: z.string().min(1),
});

export type Acerca = z.infer<typeof acercaSchema>;
