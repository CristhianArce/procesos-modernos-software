import type { Magnitud } from "@/modulos/alertas/schema";

// Fecha local es-CO en la hora de Bogotá, para que no dependa de la zona del servidor (decisiones #3 y #7).
const FECHA = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Bogota" });

export const formatearFecha = (iso: string) => FECHA.format(new Date(iso));

export const UNIDAD = { voltaje: "V", corriente: "A", potencia: "W" } as const satisfies Record<Magnitud, string>;

/** Título de la gráfica de cada magnitud, en el orden en que se dibujan. */
export const TITULO = { voltaje: "Voltaje (V)", corriente: "Corriente (A)", potencia: "Potencia (W)" } as const satisfies Record<Magnitud, string>;

export const conUnidad = (valor: number, magnitud: Magnitud) => `${valor} ${UNIDAD[magnitud]}`;
