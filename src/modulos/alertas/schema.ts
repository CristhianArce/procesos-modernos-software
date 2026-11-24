import { consultaRecientesSchema } from "@/modulos/lecturas/schema";

export { MAGNITUDES, type Magnitud } from "./magnitudes";

/** El dashboard y la API listan 20 alertas por defecto (decisión #1). */
export const alertasConsultaSchema = consultaRecientesSchema(20);
