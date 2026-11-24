import "server-only";
import { ErrorHttp } from "@/lib/errores";
import { obtenerNodo } from "@/modulos/nodos/service";
import * as repo from "./repo";
import type { Tecnico } from "./repo";

export type { Tecnico } from "./repo";
export type Asignacion = { nodoId: string; tecnico: Tecnico };

/** Asigna un técnico al nodo. Ningún rechazo escribe nada: se comprueba todo antes de asignar (CA-2, CA-3; decisión #3). */
export async function asignarTecnico(nodoId: string, tecnicoId: string): Promise<Asignacion> {
  const nodo = await obtenerNodo(nodoId); // 404 «Nodo no encontrado»
  const usuario = await repo.buscarUsuario(tecnicoId);
  if (!usuario) throw new ErrorHttp(404, "Usuario no encontrado");
  if (usuario.rol !== "tecnico") throw new ErrorHttp(400, "El usuario no es técnico"); // RN-1
  await repo.asignar(nodo.id, usuario.id);
  return { nodoId: nodo.id, tecnico: { id: usuario.id, nombreUsuario: usuario.nombreUsuario } };
}

export const tecnicoAsignado = (nodoId: string): Promise<Tecnico | null> => repo.tecnicoDeNodo(nodoId);

export const tecnicosDisponibles = (): Promise<Tecnico[]> => repo.listarTecnicos();
