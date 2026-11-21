import { beforeAll, describe, expect, it } from "vitest";
import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";

// Ruta protegida de prueba: así se protege cualquier handler de una historia (CA-6).
const GET = conHttp("/api/solo-admin", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  return Response.json({ ok: true });
});

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

const pedir = (token?: string) =>
  new Request("http://localhost/api/solo-admin", token ? { headers: { cookie: `${COOKIE_SESION}=${token}` } } : undefined);

describe("API protegida", () => {
  it("#2 CA-6: sin sesión responde 401 en JSON y sin redirección", async () => {
    const res = await GET(pedir(), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#2 CA-6: con rol insuficiente responde 403 en JSON", async () => {
    const res = await GET(pedir(await firmarSesion({ sub: "u1", rol: "tecnico" })), undefined);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Sin permiso" });
  });

  it("#2 CA-6: con el rol exigido responde 200", async () => {
    const res = await GET(pedir(await firmarSesion({ sub: "u2", rol: "administrador" })), undefined);
    expect(res.status).toBe(200);
  });
});
