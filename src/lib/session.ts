import "server-only";
import { SignJWT, jwtVerify } from "jose";

export const ROLES = ["administrador", "tecnico"] as const;
export type Rol = (typeof ROLES)[number];
export type Sesion = { sub: string; rol: Rol };

export const COOKIE_SESION = "sesion";
export const DURACION_SESION_S = 8 * 60 * 60;

function clave() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) throw new Error("SESSION_SECRET falta o tiene menos de 32 caracteres");
  return new TextEncoder().encode(secreto);
}

// Crear la cookie al iniciar sesión es de la HU 3; aquí solo se firma el token.
export function firmarSesion(sesion: Sesion, ahora = Math.floor(Date.now() / 1000)) {
  return new SignJWT({ rol: sesion.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sesion.sub)
    .setIssuedAt(ahora)
    .setExpirationTime(ahora + DURACION_SESION_S)
    .sign(clave());
}

/** Devuelve la sesión si el token es válido y vigente; null si falta, está vencido, mal firmado o trae un rol desconocido. */
export async function verificarSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  const k = clave(); // fuera del try: sin SESSION_SECRET la app debe fallar, no desloguear a todos en silencio
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"] });
    const rol = payload.rol as Rol;
    if (typeof payload.sub !== "string" || !ROLES.includes(rol)) return null;
    return { sub: payload.sub, rol };
  } catch {
    return null;
  }
}
