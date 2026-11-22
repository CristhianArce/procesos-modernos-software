import { z } from "zod";

// Los máximos impiden que una contraseña enorme encarezca el scrypt (design.md, decisión #7).
export const loginSchema = z.object({
  usuario: z.string().trim().min(1).max(64),
  contrasena: z.string().min(1).max(128),
});

export type LoginEntrada = z.infer<typeof loginSchema>;
