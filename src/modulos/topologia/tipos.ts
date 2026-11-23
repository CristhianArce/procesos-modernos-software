// Sin Zod: los componentes de cliente importan de aquí para no cargar Zod en el navegador (schema.ts lo reexporta).

/** Símbolo del nodo en el mímico, del origen de la energía al consumo. */
export const TIPOS_NODO = ["generacion", "subestacion", "transformador", "alimentador", "carga"] as const;
export type TipoNodo = (typeof TIPOS_NODO)[number];
