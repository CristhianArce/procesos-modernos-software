import "server-only";
import { logger } from "@/lib/logger";
import type { ConsultaRecientes } from "@/modulos/lecturas/schema";
import type { Lectura } from "@/modulos/lecturas/service";
import type { Sensor } from "@/modulos/sensores/repo";
import { registro } from "@/nav/registro";
import * as repo from "./repo";
import type { Alerta, AlertaNueva } from "./repo";
import { MAGNITUDES, type Magnitud } from "./schema";

export type { Alerta } from "./repo";

type Umbrales = Pick<Sensor, "id" | "umbralVoltaje" | "umbralCorriente" | "umbralPotencia">;

const CAMPO_UMBRAL = {
  voltaje: "umbralVoltaje",
  corriente: "umbralCorriente",
  potencia: "umbralPotencia",
} as const satisfies Record<Magnitud, keyof Umbrales>;

/** Una alerta por cada magnitud cuyo valor supera su umbral máximo; sin umbral no hay alerta (CA-3, RN-1). */
export function excesos(lectura: Lectura, sensor: Umbrales): AlertaNueva[] {
  return MAGNITUDES.flatMap((magnitud) => {
    const umbral = sensor[CAMPO_UMBRAL[magnitud]];
    const valor = lectura[magnitud];
    return umbral !== null && valor > umbral ? [{ sensorId: lectura.sensorId, magnitud, valor, umbral }] : [];
  });
}

/** Guarda las alertas de las lecturas y después avisa a los suscriptores (CA-3, CA-5, RN-6). */
export async function registrarAlertas(lecturas: Lectura[], sensores: Umbrales[]): Promise<Alerta[]> {
  const porId = new Map(sensores.map((s) => [s.id, s]));
  const nuevas = lecturas.flatMap((l) => {
    const sensor = porId.get(l.sensorId);
    return sensor ? excesos(l, sensor) : [];
  });
  if (nuevas.length === 0) return [];
  const alertas = await repo.insertar(nuevas);
  for (const alerta of alertas) await avisar(alerta);
  return alertas;
}

/** El fallo de un suscriptor se registra y no impide avisar a los demás (CA-5). */
async function avisar(alerta: Alerta) {
  for (const suscriptor of registro.suscriptores) {
    try {
      await suscriptor.manejar(alerta);
    } catch (err) {
      logger.error({ modulo: suscriptor.modulo, alertaId: alerta.id, err }, "falló un suscriptor de alertas");
    }
  }
}

export const listarAlertas = (consulta: ConsultaRecientes): Promise<Alerta[]> => repo.recientes(consulta);
