import { z } from "zod";
import { LIENZO_MAX, TIPOS_NODO } from "./tipos";

export { LIENZO_MAX, TIPOS_NODO, type TipoNodo } from "./tipos";

const coordenada = z.number().min(0).max(LIENZO_MAX);

export const posicionSchema = z.object({ tipo: z.enum(TIPOS_NODO), x: coordenada, y: coordenada });

export const enlaceCrearSchema = z
  .object({ origenId: z.guid(), destinoId: z.guid() })
  .refine((e) => e.origenId !== e.destinoId, { message: "Un enlace no puede unir un nodo consigo mismo", path: ["destinoId"] });

export type Posicion = z.infer<typeof posicionSchema>;
export type EnlaceCrear = z.infer<typeof enlaceCrearSchema>;
