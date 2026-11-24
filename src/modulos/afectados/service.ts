import "server-only";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Afectado } from "./repo";

export type { Afectado } from "./repo";
export type AfectadosNodo = { total: number; afectados: Afectado[] };

/** Afectados del nodo con su total; 404 si el nodo no existe (CA-3). */
export async function listarAfectados(nodoId: string): Promise<AfectadosNodo> {
  await obtenerNodo(nodoId);
  const afectados = await repo.listarPorNodo(nodoId);
  return { total: afectados.length, afectados };
}
