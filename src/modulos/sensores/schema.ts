import { z } from "zod";
import { alMenosUnCampo, MENSAJE_SIN_CAMPOS, nombreSchema } from "@/modulos/nodos/schema";

// Umbral máximo de una magnitud: opcional; null lo quita (decisiones #3 y #14).
const umbral = z.number().positive().nullable().optional();
const umbrales = { umbralVoltaje: umbral, umbralCorriente: umbral, umbralPotencia: umbral };

export const sensorCrearSchema = z.object({ nodoId: z.guid(), nombre: nombreSchema, ...umbrales });

// El nodo del sensor no es editable.
export const sensorEditarSchema = z
  .object({ nombre: nombreSchema.optional(), ...umbrales })
  .refine(alMenosUnCampo, { message: MENSAJE_SIN_CAMPOS });

/** Parámetros de `GET /api/sensores`. */
export const sensoresConsultaSchema = z.object({ nodoId: z.guid() });

export type SensorCrear = z.infer<typeof sensorCrearSchema>;
export type SensorEditar = z.infer<typeof sensorEditarSchema>;
