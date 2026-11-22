import { z } from "zod";

/** Postgres acepta cualquier UUID con forma 8-4-4-4-12; un id que no la tiene se trata como inexistente (decisión #13). */
export const esUuid = (id: string) => z.guid().safeParse(id).success;

/** Nombre de un nodo o de un sensor (decisión #14). */
export const nombreSchema = z.string().trim().min(1).max(80);

// Una ubicación vacía se guarda como null.
const ubicacion = z
  .string()
  .trim()
  .max(120)
  .nullable()
  .transform((v) => v || null);

/** Editar exige al menos un campo de los editables (decisión #14). */
export const alMenosUnCampo = (datos: Record<string, unknown>) => Object.values(datos).some((v) => v !== undefined);
export const MENSAJE_SIN_CAMPOS = "Envía al menos un campo para editar";

export const nodoCrearSchema = z.object({ nombre: nombreSchema, ubicacion: ubicacion.optional() });

// El estado no es editable aquí: lo cambia la HU 6.
export const nodoEditarSchema = z
  .object({ nombre: nombreSchema.optional(), ubicacion: ubicacion.optional() })
  .refine(alMenosUnCampo, { message: MENSAJE_SIN_CAMPOS });

export type NodoCrear = z.infer<typeof nodoCrearSchema>;
export type NodoEditar = z.infer<typeof nodoEditarSchema>;
