import "server-only";
import { registrarLecturas, type Lectura } from "@/modulos/lecturas/service";
import { listarSensores } from "@/modulos/sensores/service";
import { generarLectura } from "./generador";

/** Registra una lectura por cada sensor del nodo; 404 si el nodo no existe y cero lecturas si no tiene sensores. */
export async function simular(nodoId: string, azar: () => number = Math.random): Promise<Lectura[]> {
  const sensores = await listarSensores(nodoId);
  return registrarLecturas(sensores.map((s) => ({ sensorId: s.id, ...generarLectura(s, azar) })));
}
