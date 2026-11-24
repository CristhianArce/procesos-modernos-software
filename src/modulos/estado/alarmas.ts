import type { Magnitud } from "@/modulos/alertas/schema";

/** Alerta reciente tal como la muestra el panel de alarmas: con los nombres de su nodo y su sensor. */
export type AlertaReciente = {
  id: string;
  nodoId: string;
  nodoNombre: string;
  sensorNombre: string;
  magnitud: Magnitud;
  valor: number;
  umbral: number;
  creadaEn: string;
};

/** Desde este exceso sobre el umbral la alarma es alta (decisión #20 del plan; el modelo tiene una sola severidad). */
export const EXCESO_ALTO = 0.1;

export function severidad(a: Pick<AlertaReciente, "valor" | "umbral">) {
  const exceso = Math.round((a.valor / a.umbral - 1) * 1000) / 1000;
  return { nivel: exceso >= EXCESO_ALTO ? ("alta" as const) : ("media" as const), exceso };
}

/** Alta antes que media; dentro de cada una, la más reciente primero. */
export function ordenarAlarmas(alertas: readonly AlertaReciente[]): AlertaReciente[] {
  const peso = (a: AlertaReciente) => (severidad(a).nivel === "alta" ? 0 : 1);
  return [...alertas].sort((a, b) => peso(a) - peso(b) || b.creadaEn.localeCompare(a.creadaEn) || b.id.localeCompare(a.id));
}

export type FiltroAlarmas = { nodoId: string | null; magnitud: Magnitud | null };

export const filtrarAlarmas = (alertas: readonly AlertaReciente[], { nodoId, magnitud }: FiltroAlarmas) =>
  alertas.filter((a) => (!nodoId || a.nodoId === nodoId) && (!magnitud || a.magnitud === magnitud));
