import "server-only";
import * as repo from "./repo";
import type { Lectura, LecturaNueva } from "./repo";
import type { ConsultaRecientes } from "./schema";

export type { Lectura, LecturaNueva } from "./repo";

export async function registrarLecturas(nuevas: LecturaNueva[]): Promise<Lectura[]> {
  return nuevas.length === 0 ? [] : repo.insertar(nuevas);
}

/** Última lectura de cada sensor, indexada por el id del sensor. */
export async function ultimasLecturas(sensorIds: string[]): Promise<Map<string, Lectura>> {
  const ultimas = sensorIds.length === 0 ? [] : await repo.ultimasPorSensor(sensorIds);
  return new Map(ultimas.map((l) => [l.sensorId, l]));
}

export const listarLecturas = (consulta: ConsultaRecientes): Promise<Lectura[]> => repo.recientes(consulta);

/** Las `limite` lecturas más recientes de cada sensor, de la más antigua a la más reciente, indexadas por sensor (CA-2). */
export async function lecturasRecientesPorSensor(sensorIds: string[], limite: number): Promise<Map<string, Lectura[]>> {
  const lecturas = sensorIds.length === 0 ? [] : await repo.recientesPorSensor(sensorIds, limite);
  const porSensor = new Map<string, Lectura[]>();
  for (const l of lecturas) porSensor.set(l.sensorId, [...(porSensor.get(l.sensorId) ?? []), l]);
  return porSensor;
}

/** Poda de lecturas antiguas del simulador continuo (rediseño SCADA): conserva la última de cada sensor. */
export const podarLecturas = (minutos: number): Promise<number> => repo.podar(minutos);
