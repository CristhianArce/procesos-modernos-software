import "server-only";
import { ZodError } from "zod";
import { ErrorHttp } from "./errores";
import { logger } from "./logger";
import { registrarPeticion } from "./metrics";

export const errorJson = (estado: number, error: string) => Response.json({ error }, { status: estado });

/**
 * Envoltorio de todo Route Handler (CLAUDE.md §4): traduce errores a JSON, mide la petición
 * y registra una línea con método, ruta, estado y duración. Nunca lee ni registra el cuerpo.
 * `ruta` es la plantilla (`/api/nodos/[id]`), no la URL real, para acotar la cardinalidad de las métricas.
 */
export function conHttp<C = unknown>(
  ruta: string,
  handler: (req: Request, ctx: C) => Response | Promise<Response>,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const inicio = performance.now();
    let res: Response;
    try {
      res = await handler(req, ctx);
    } catch (e) {
      if (e instanceof ErrorHttp) {
        res = errorJson(e.estado, e.message);
      } else if (e instanceof ZodError) {
        const detalles = e.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
        res = Response.json({ error: "Datos inválidos", detalles }, { status: 400 });
      } else {
        logger.error({ ruta, err: e }, "error no controlado");
        res = errorJson(500, "Error interno");
      }
    }
    const ms = performance.now() - inicio;
    registrarPeticion(req.method, ruta, res.status, ms / 1000);
    logger.info({ metodo: req.method, ruta, estado: res.status, ms: Math.round(ms) }, "peticion");
    return res;
  };
}
