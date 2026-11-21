import { beforeAll, describe, expect, it } from "vitest";
import { requireRole, sessionFromRequest } from "@/lib/dal";
import { ErrorHttp } from "@/lib/errores";
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion, verificarSesion } from "@/lib/session";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

const conCookie = (token: string) =>
  new Request("http://localhost/api/x", { headers: { cookie: `otra=1; ${COOKIE_SESION}=${token}` } });

async function errorDe(p: Promise<unknown> | (() => unknown)) {
  try {
    await (typeof p === "function" ? p() : p);
  } catch (e) {
    return e as ErrorHttp;
  }
  throw new Error("se esperaba un error");
}

describe("session y dal", () => {
  it("#2 CA-6: un token válido devuelve sub y rol", async () => {
    const token = await firmarSesion({ sub: "u1", rol: "tecnico" });
    expect(await verificarSesion(token)).toEqual({ sub: "u1", rol: "tecnico" });
  });

  it("#2 CA-6: una firma inválida da null", async () => {
    const token = await firmarSesion({ sub: "u1", rol: "tecnico" });
    process.env.SESSION_SECRET = "y".repeat(32);
    expect(await verificarSesion(token)).toBeNull();
    process.env.SESSION_SECRET = "x".repeat(32);
  });

  it("#2 CA-6: un token vencido da null", async () => {
    const hace9h = Math.floor(Date.now() / 1000) - DURACION_SESION_S - 3600;
    expect(await verificarSesion(await firmarSesion({ sub: "u1", rol: "tecnico" }, hace9h))).toBeNull();
  });

  it("#2 CA-6: sin SESSION_SECRET falla en lugar de desloguear en silencio", async () => {
    delete process.env.SESSION_SECRET;
    await expect(verificarSesion("algo")).rejects.toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = "x".repeat(32);
  });

  it("#2 CA-6: sin cookie, sessionFromRequest lanza 401", async () => {
    const e = await errorDe(sessionFromRequest(new Request("http://localhost/api/x")));
    expect(e).toBeInstanceOf(ErrorHttp);
    expect(e.estado).toBe(401);
  });

  it("#2 CA-6: lee la sesión de la cookie entre otras", async () => {
    const token = await firmarSesion({ sub: "u2", rol: "administrador" });
    expect(await sessionFromRequest(conCookie(token))).toEqual({ sub: "u2", rol: "administrador" });
  });

  it("#2 CA-6: requireRole con rol insuficiente lanza 403", async () => {
    const e = await errorDe(() => requireRole({ sub: "u1", rol: "tecnico" }, "administrador"));
    expect(e.estado).toBe(403);
    expect(requireRole({ sub: "u2", rol: "administrador" }, "administrador").sub).toBe("u2");
  });
});
