import "server-only";
import { ErrorHttp } from "@/lib/errores";
import { esUuid } from "@/modulos/nodos/schema";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Enlace, NodoTopologia, PosicionGuardada } from "./repo";
import type { EnlaceCrear, Posicion } from "./schema";

export type { Enlace, NodoTopologia, PosicionGuardada } from "./repo";
export type Topologia = { nodos: NodoTopologia[]; enlaces: Enlace[] };

export async function obtenerTopologia(): Promise<Topologia> {
  const [nodos, enlaces] = await Promise.all([repo.listarNodos(), repo.listarEnlaces()]);
  return { nodos, enlaces };
}

/** 404 si el nodo no existe. */
export async function posicionarNodo(nodoId: string, posicion: Posicion): Promise<PosicionGuardada> {
  await obtenerNodo(nodoId);
  return repo.guardarPosicion(nodoId, posicion);
}

/** 404 si alguno de los nodos no existe; 409 si ya están enlazados. */
export async function crearEnlace(entrada: EnlaceCrear): Promise<Enlace> {
  await Promise.all([obtenerNodo(entrada.origenId), obtenerNodo(entrada.destinoId)]);
  const enlace = await repo.crearEnlace(entrada);
  if (!enlace) throw new ErrorHttp(409, "Ya existe un enlace entre esos nodos");
  return enlace;
}

export async function eliminarEnlace(id: string): Promise<void> {
  if (!esUuid(id) || !(await repo.eliminarEnlace(id))) throw new ErrorHttp(404, "Enlace no encontrado");
}
