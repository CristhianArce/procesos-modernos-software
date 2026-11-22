import { conHttp } from "@/lib/http";
import { cookieVencida } from "@/modulos/auth/cookie";

export const dynamic = "force-dynamic";

// Idempotente y sin exigir sesión: borrar la cookie no revela nada (design.md, decisión #5).
export const POST = conHttp("/api/auth/logout", (req) =>
  Response.json({ ok: true }, { headers: { "Set-Cookie": cookieVencida(req) } }),
);
