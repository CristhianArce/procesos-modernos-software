import { COOKIE_SESION, firmarSesion, type Rol } from "@/lib/session";

// Apoyo de las pruebas de integración de Route Handlers.
process.env.SESSION_SECRET ??= "x".repeat(32);

type Opciones = { rol?: Rol; cuerpo?: unknown; crudo?: string };

/** `Request` con la sesión del rol indicado (sin `rol`, sin sesión) y un cuerpo JSON (`cuerpo`) o literal (`crudo`). */
export async function peticion(metodo: string, ruta: string, { rol, cuerpo, crudo }: Opciones = {}): Promise<Request> {
  const headers: Record<string, string> = {};
  if (rol) headers.cookie = `${COOKIE_SESION}=${await firmarSesion({ sub: `prueba-${rol}`, rol })}`;
  const body = crudo ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo));
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(`http://localhost${ruta}`, { method: metodo, headers, body });
}

/** Contexto de una ruta con `[id]`, como lo entrega Next. */
export const conId = (id: string) => ({ params: Promise.resolve({ id }) });
