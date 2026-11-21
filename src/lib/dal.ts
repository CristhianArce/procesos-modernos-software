import "server-only";
import { cookies } from "next/headers";
import { ErrorHttp } from "./errores";
import { COOKIE_SESION, verificarSesion, type Rol, type Sesion } from "./session";

function leerCookie(cabecera: string | null, nombre: string) {
  for (const parte of cabecera?.split(";") ?? []) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Para Route Handlers: la sesión de la petición o ErrorHttp(401). */
export async function sessionFromRequest(req: Request): Promise<Sesion> {
  const sesion = await verificarSesion(leerCookie(req.headers.get("cookie"), COOKIE_SESION));
  if (!sesion) throw new ErrorHttp(401, "No autenticado");
  return sesion;
}

/** La sesión si su rol está entre los permitidos; si no, ErrorHttp(403). */
export function requireRole(sesion: Sesion, ...roles: Rol[]): Sesion {
  if (!roles.includes(sesion.rol)) throw new ErrorHttp(403, "Sin permiso");
  return sesion;
}

/** Para páginas y layouts (Server Components): la sesión actual o null. */
export async function sesionActual(): Promise<Sesion | null> {
  return verificarSesion((await cookies()).get(COOKIE_SESION)?.value);
}
