import { z } from "zod";

/** Símbolo del nodo en el mímico, del origen de la energía al consumo. */
export const TIPOS_NODO = ["generacion", "subestacion", "transformador", "alimentador", "carga"] as const;
export type TipoNodo = (typeof TIPOS_NODO)[number];

/** Las coordenadas viven en un lienzo de 0 a 2000 en cada eje (la migración tiene la misma restricción). */
export const LIENZO_MAX = 2000;

const coordenada = z.number().min(0).max(LIENZO_MAX);

export const posicionSchema = z.object({ tipo: z.enum(TIPOS_NODO), x: coordenada, y: coordenada });

export const enlaceCrearSchema = z
  .object({ origenId: z.guid(), destinoId: z.guid() })
  .refine((e) => e.origenId !== e.destinoId, { message: "Un enlace no puede unir un nodo consigo mismo", path: ["destinoId"] });

export type Posicion = z.infer<typeof posicionSchema>;
export type EnlaceCrear = z.infer<typeof enlaceCrearSchema>;
