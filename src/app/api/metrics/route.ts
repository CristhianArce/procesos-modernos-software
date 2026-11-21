import { timingSafeEqual } from "node:crypto";
import { ErrorHttp } from "@/lib/errores";
import { conHttp } from "@/lib/http";
import { metricas } from "@/lib/metrics";

export const dynamic = "force-dynamic";

function autorizado(req: Request) {
  const esperado = process.env.METRICS_TOKEN;
  const cabecera = req.headers.get("authorization");
  if (!esperado || !cabecera?.startsWith("Bearer ")) return false;
  const recibido = Buffer.from(cabecera.slice("Bearer ".length));
  const correcto = Buffer.from(esperado);
  return recibido.length === correcto.length && timingSafeEqual(recibido, correcto);
}

export const GET = conHttp("/api/metrics", async (req) => {
  if (!autorizado(req)) throw new ErrorHttp(401, "Token de métricas inválido");
  return new Response(await metricas.registro.metrics(), {
    headers: { "Content-Type": metricas.registro.contentType },
  });
});
