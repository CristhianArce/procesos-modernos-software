import "server-only";
import { ErrorHttp } from "@/lib/errores";
import { ultimasLecturas, type Lectura } from "@/modulos/lecturas/service";
import { esUuid } from "@/modulos/nodos/schema";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Sensor } from "./repo";
import type { SensorCrear, SensorEditar } from "./schema";

/** Cada sensor trae su última lectura, o null si aún no tiene (decisión #18). */
export type SensorConLectura = Sensor & { ultimaLectura: Lectura | null };

const noEncontrado = () => new ErrorHttp(404, "Sensor no encontrado");

async function conUltimaLectura(sensores: Sensor[]): Promise<SensorConLectura[]> {
  const ultimas = await ultimasLecturas(sensores.map((s) => s.id));
  return sensores.map((s) => ({ ...s, ultimaLectura: ultimas.get(s.id) ?? null }));
}

async function existente(sensor: Sensor | null): Promise<SensorConLectura> {
  if (!sensor) throw noEncontrado();
  return (await conUltimaLectura([sensor]))[0];
}

/** Sensores del nodo; 404 si el nodo no existe. */
export async function listarSensores(nodoId: string): Promise<SensorConLectura[]> {
  await obtenerNodo(nodoId);
  return conUltimaLectura(await repo.listarPorNodo(nodoId));
}

/** Todos los sensores de la red, sin su última lectura: el dashboard trae su serie aparte (HU 5, decisión #12). */
export const listarTodosLosSensores = (): Promise<Sensor[]> => repo.listarTodos();

/** 404 si el nodo no existe (decisión #13). */
export async function crearSensor(entrada: SensorCrear): Promise<SensorConLectura> {
  await obtenerNodo(entrada.nodoId);
  return { ...(await repo.crear(entrada)), ultimaLectura: null };
}

export async function obtenerSensor(id: string): Promise<SensorConLectura> {
  return existente(esUuid(id) ? await repo.buscar(id) : null);
}

export async function editarSensor(id: string, cambios: SensorEditar): Promise<SensorConLectura> {
  return existente(esUuid(id) ? await repo.actualizar(id, cambios) : null);
}

export async function eliminarSensor(id: string): Promise<void> {
  if (!esUuid(id) || !(await repo.eliminar(id))) throw noEncontrado();
}
