import { conHttp } from "@/lib/http";
import { cookieDeSesion } from "@/modulos/auth/cookie";
import { loginSchema } from "@/modulos/auth/schema";
import { iniciarSesion, LimiteExcedido } from "@/modulos/auth/service";

export const dynamic = "force-dynamic";

// Un cliente puede falsear x-forwarded-for; el límite por usuario sigue vigente (design.md, decisión #4).
const ipDe = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";

export const POST = conHttp("/api/auth/login", async (req) => {
  // Un cuerpo que no es JSON falla en Zod y responde 400, no 500 (CA-3).
  const entrada = loginSchema.parse(await req.json().catch(() => undefined));
  try {
    const { token, usuario, rol } = await iniciarSesion({ ...entrada, ip: ipDe(req) });
    return Response.json({ usuario, rol }, { headers: { "Set-Cookie": cookieDeSesion(token, req) } });
  } catch (e) {
    if (e instanceof LimiteExcedido) {
      return Response.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.reintentarEnS) } });
    }
    throw e;
  }
});
