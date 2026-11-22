import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { requireRole, sessionFromRequest } from "@/lib/dal";
import { db } from "@/lib/db";
import { conHttp } from "@/lib/http";
import { proxy } from "@/proxy";

// Cuentas de demostración de db/seed/auth.sql; se usan como lo haría una persona: iniciando sesión.
let acciones = 0;
const soloAdministradores = conHttp("/api/solo-administradores-de-prueba", async (req) => {
  requireRole(await sessionFromRequest(req), "administrador");
  acciones += 1;
  return Response.json({ ok: true });
});

beforeAll(async () => {
  process.env.SESSION_SECRET = "x".repeat(32);
  await db().query(readFileSync("db/seed/auth.sql", "utf8"));
});

afterAll(() => db().end());

async function cookieDeLogin(usuario: string, contrasena: string, ip: string) {
  const res = await login(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ usuario, contrasena }),
    }),
    undefined,
  );
  expect(res.status).toBe(200);
  return res.headers.get("set-cookie")!.split(";")[0]; // "sesion=<token>"
}

const api = (cookie?: string) =>
  new Request("http://localhost/api/solo-administradores-de-prueba", cookie ? { headers: { cookie } } : undefined);
const pagina = (cookie?: string) => new NextRequest("http://localhost/", cookie ? { headers: { cookie } } : undefined);

describe("acceso con la sesión emitida por el login", () => {
  it("#20 CA-5: una página del tablero sin sesión redirige a /login", async () => {
    const res = await proxy(pagina());
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("#20 CA-5: una ruta /api protegida sin sesión responde 401 en JSON y sin redirección", async () => {
    const res = await soloAdministradores(api(), undefined);
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toEqual({ error: "No autenticado" });
  });

  it("#20 CA-5: la cookie que entrega el login deja pasar a una página del tablero", async () => {
    const res = await proxy(pagina(await cookieDeLogin("tecnico", "Demo-Tecnico-2026", "10.9.0.1")));
    expect(res.headers.get("location")).toBeNull();
  });

  it("#20 CA-6: una sesión de técnico recibe 403 en JSON y la acción no se ejecuta", async () => {
    const antes = acciones;
    const res = await soloAdministradores(api(await cookieDeLogin("tecnico", "Demo-Tecnico-2026", "10.9.0.2")), undefined);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Sin permiso" });
    expect(acciones).toBe(antes);
  });

  it("#20 CA-6: una sesión de administrador ejecuta la misma acción y recibe 200", async () => {
    const antes = acciones;
    const res = await soloAdministradores(api(await cookieDeLogin("admin", "Demo-Admin-2026", "10.9.0.3")), undefined);
    expect(res.status).toBe(200);
    expect(acciones).toBe(antes + 1);
  });
});
