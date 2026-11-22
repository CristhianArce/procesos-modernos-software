import "server-only";
import { registrarAlertas } from "@/modulos/alertas/service";
import { registrarLecturas, type Lectura } from "@/modulos/lecturas/service";
import { listarSensores } from "@/modulos/sensores/service";
import { generarLectura } from "./generador";

/** Registra una lectura por cada sensor del nodo y sus alertas; 404 si el nodo no existe y cero lecturas si no tiene sensores. */
export async function simular(nodoId: string, azar: () => number = Math.random): Promise<Lectura[]> {
  const sensores = await listarSensores(nodoId);
  const lecturas = await registrarLecturas(sensores.map((s) => ({ sensorId: s.id, ...generarLectura(s, azar) })));
  await registrarAlertas(lecturas, sensores); // HU 5 (#22): las alertas se evalúan donde se registran lecturas (decisión #5)
  return lecturas;
}
