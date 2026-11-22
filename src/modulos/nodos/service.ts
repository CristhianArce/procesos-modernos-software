import "server-only";
import { ErrorHttp } from "@/lib/errores";
import * as repo from "./repo";
import type { Nodo } from "./repo";
import { esUuid, type NodoCrear, type NodoEditar } from "./schema";

export type { Nodo } from "./repo";

const noEncontrado = () => new ErrorHttp(404, "Nodo no encontrado");

export const listarNodos = (): Promise<Nodo[]> => repo.listar();

export const crearNodo = (entrada: NodoCrear): Promise<Nodo> => repo.crear(entrada);

/** Para páginas: el nodo o null (la página decide qué mostrar). */
export async function buscarNodo(id: string): Promise<Nodo | null> {
  return esUuid(id) ? repo.buscar(id) : null;
}

export async function obtenerNodo(id: string): Promise<Nodo> {
  const nodo = await buscarNodo(id);
  if (!nodo) throw noEncontrado();
  return nodo;
}

export async function editarNodo(id: string, cambios: NodoEditar): Promise<Nodo> {
  const nodo = esUuid(id) ? await repo.actualizar(id, cambios) : null;
  if (!nodo) throw noEncontrado();
  return nodo;
}

export async function eliminarNodo(id: string): Promise<void> {
  if (!esUuid(id) || !(await repo.eliminar(id))) throw noEncontrado();
}
