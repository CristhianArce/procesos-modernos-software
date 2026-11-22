import { COOKIE_SESION, DURACION_SESION_S } from "@/lib/session";

// `Secure` solo si la petición llegó por HTTPS: así funciona en local por http y en Render por https
// (design.md, decisión #5). Se arma el encabezado a mano para poder probar los handlers con Request.
const llegoPorHttps = (req: Request) => req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";

function cookie(valor: string, maxAge: number, req: Request) {
  return [`${COOKIE_SESION}=${valor}`, "HttpOnly", "SameSite=Lax", "Path=/", `Max-Age=${maxAge}`, ...(llegoPorHttps(req) ? ["Secure"] : [])].join("; ");
}

export const cookieDeSesion = (token: string, req: Request) => cookie(token, DURACION_SESION_S, req);

export const cookieVencida = (req: Request) => cookie("", 0, req);
