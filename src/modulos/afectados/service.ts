import "server-only";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Afectado } from "./repo";

export type AfectadosDeNodo = { total: number; afectados: Afectado[] };

/** Afectados del nodo con su total; 404 si el nodo no existe (CA-3). */
export async function listarAfectados(nodoId: string): Promise<AfectadosDeNodo> {
  await obtenerNodo(nodoId);
  const afectados = await repo.listarPorNodo(nodoId);
  return { total: afectados.length, afectados };
}
