import { consultaRecientesSchema } from "@/modulos/lecturas/schema";

export const MAGNITUDES = ["voltaje", "corriente", "potencia"] as const;
export type Magnitud = (typeof MAGNITUDES)[number];

/** El dashboard y la API listan 20 alertas por defecto (decisión #1). */
export const alertasConsultaSchema = consultaRecientesSchema(20);
