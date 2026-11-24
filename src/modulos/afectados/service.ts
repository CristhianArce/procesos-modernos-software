import "server-only";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Afectado } from "./repo";
import type { AfectadoCrear } from "./schema";

/** 404 `Nodo no encontrado` si el nodo no existe, sin guardar nada (CA-3). */
export async function agregarAfectado(entrada: AfectadoCrear): Promise<Afectado> {
  await obtenerNodo(entrada.nodoId);
  return repo.crear(entrada);
}

/** Afectados del nodo en orden de alta, para el panel de la ficha. */
export const listarAfectados = (nodoId: string): Promise<Afectado[]> => repo.listarPorNodo(nodoId);
