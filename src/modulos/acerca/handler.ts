import { obtenerAcerca } from "./service";

export type Rol = "administrador" | "tecnico";
export type Sesion = { rol: Rol };
export type ObtenerSesion = (req: Request) => Sesion | null;

// La sesión se inyecta hasta que la HU 1b aporte sessionFromRequest (decisión #2).
export function crearGetAcerca(obtenerSesion: ObtenerSesion) {
  return async function GET(req: Request): Promise<Response> {
    if (!obtenerSesion(req)) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    return Response.json(obtenerAcerca());
  };
}
