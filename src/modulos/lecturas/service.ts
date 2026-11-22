import "server-only";
import * as repo from "./repo";
import type { Lectura, LecturaNueva } from "./repo";

export type { Lectura, LecturaNueva } from "./repo";

export async function registrarLecturas(nuevas: LecturaNueva[]): Promise<Lectura[]> {
  return nuevas.length === 0 ? [] : repo.insertar(nuevas);
}

/** Última lectura de cada sensor, indexada por el id del sensor. */
export async function ultimasLecturas(sensorIds: string[]): Promise<Map<string, Lectura>> {
  const ultimas = sensorIds.length === 0 ? [] : await repo.ultimasPorSensor(sensorIds);
  return new Map(ultimas.map((l) => [l.sensorId, l]));
}
