import { beforeAll, describe, expect, it } from "vitest";
import { requireRole, sessionFromRequest } from "@/lib/dal";
import { conHttp } from "@/lib/http";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";
import { POST } from "../auth/logout/route";

// Ruta protegida de prueba: lo que ve la API después de cerrar sesión.
const protegida = conHttp("/api/protegida-de-prueba", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador", "tecnico");
  return Response.json({ ok: true });
});

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

const cerrar = (cookie?: string) =>
  POST(new Request("http://localhost/api/auth/logout", { method: "POST", headers: cookie ? { cookie } : {} }), undefined);

describe("POST /api/auth/logout", () => {
  it("#20 CA-7: con sesión responde 200 y fija la cookie de sesión vencida", async () => {
    const token = await firmarSesion({ sub: "u1", rol: "tecnico" });
    const res = await cerrar(`${COOKIE_SESION}=${token}`);
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toMatch(new RegExp(`^${COOKIE_SESION}=;`));
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("#20 CA-7: sin sesión también responde 200 (es idempotente)", async () => {
    expect((await cerrar()).status).toBe(200);
  });

  it("#20 CA-7: la cookie recibida al cerrar sesión ya no abre una ruta protegida (401)", async () => {
    const token = await firmarSesion({ sub: "u2", rol: "administrador" });
    const antes = await protegida(new Request("http://localhost/api/protegida-de-prueba", { headers: { cookie: `${COOKIE_SESION}=${token}` } }), undefined);
    expect(antes.status).toBe(200);

    const cookieVencida = (await cerrar(`${COOKIE_SESION}=${token}`)).headers.get("set-cookie")!.split(";")[0]; // "sesion="
    const despues = await protegida(new Request("http://localhost/api/protegida-de-prueba", { headers: { cookie: cookieVencida } }), undefined);
    expect(despues.status).toBe(401);
    expect(await despues.json()).toEqual({ error: "No autenticado" });
  });
});
