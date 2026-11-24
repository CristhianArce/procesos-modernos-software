// Sin Zod: los componentes de cliente importan de aquí para no cargar Zod en el navegador (schema.ts lo reexporta).
export const MAGNITUDES = ["voltaje", "corriente", "potencia"] as const;
export type Magnitud = (typeof MAGNITUDES)[number];
