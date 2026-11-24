// Sin Zod ni código de servidor: los componentes de cliente pueden importar de aquí.
import type { Magnitud } from "@/modulos/alertas/magnitudes";

export type Notificacion = {
  id: string;
  /** Copia del nombre del sensor tal como venía en la alerta. */
  sensor: string;
  magnitud: Magnitud;
  valor: number;
  /** Fecha de la alerta, ISO 8601. */
  fecha: string;
  leida: boolean;
};

export type CentroNotificaciones = { notificaciones: Notificacion[]; noLeidas: number };

/** Cuántas notificaciones se listan; las no leídas se cuentan sobre todas (decisión #1). */
export const LIMITE_NOTIFICACIONES = 50;
