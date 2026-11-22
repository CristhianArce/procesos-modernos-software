import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { COOKIE_SESION, verificarSesion } from "@/lib/session";
import { hashearContrasena } from "@/modulos/auth/contrasena";

const { lineas } = vi.hoisted(() => ({ lineas: [] as string[] }));
vi.mock("@/lib/logger", async (original) => {
  const m = await original<typeof import("@/lib/logger")>();
  return { ...m, logger: m.crearLogger({ write: (s: string) => void lineas.push(s) }, "info") };
});

const { POST } = await import("../auth/login/route");

const prefijo = `prueba-login-${randomUUID().slice(0, 8)}`;
const usuario = `${prefijo}-ana`;
const clave = "Clave-De-Prueba-1";
let idUsuario = "";

beforeAll(async () => {
  process.env.SESSION_SECRET = "x".repeat(32);
  const { rows } = await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, $2, 'administrador') RETURNING id", [
    usuario,
    await hashearContrasena(clave),
  ]);
  idUsuario = rows[0].id;
});

beforeEach(() => void (lineas.length = 0));

afterAll(async () => {
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

// Cada caso usa su propia IP para que el limitador (en memoria) de uno no afecte a otro.
function pedir(cuerpo: unknown, { ip, cabeceras = {}, url = "http://localhost/api/auth/login" }: { ip: string; cabeceras?: Record<string, string>; url?: string }) {
  return POST(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, ...cabeceras },
      body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    }),
    undefined,
  );
}

describe("POST /api/auth/login", () => {
  it("#20 CA-1: con credenciales correctas responde 200 y una cookie httpOnly de 8 horas con el id y el rol", async () => {
    const res = await pedir({ usuario, contrasena: clave }, { ip: "10.1.0.1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ usuario, rol: "administrador" });
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toMatch(new RegExp(`^${COOKIE_SESION}=[^;]+`));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=28800");
    expect(cookie).not.toContain("Secure");
    const token = cookie.split(";")[0].split("=")[1];
    expect(await verificarSesion(token)).toEqual({ sub: idUsuario, rol: "administrador" });
  });

  it("#20 CA-1: agrega Secure cuando la petición llegó por HTTPS", async () => {
    const res = await pedir({ usuario, contrasena: clave }, { ip: "10.1.0.2", cabeceras: { "x-forwarded-proto": "https" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("Secure");
  });

  it("#20 CA-2: usuario inexistente y contraseña incorrecta responden el mismo 401 y sin cookie", async () => {
    const incorrecta = await pedir({ usuario, contrasena: "mala" }, { ip: "10.2.0.1" });
    const inexistente = await pedir({ usuario: `${prefijo}-nadie`, contrasena: "mala" }, { ip: "10.2.0.2" });
    for (const res of [incorrecta, inexistente]) {
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
    expect(await incorrecta.json()).toEqual({ error: "Credenciales inválidas" });
    expect(await inexistente.json()).toEqual({ error: "Credenciales inválidas" });
  });

  it("#20 CA-2: el registro del servidor no contiene la contraseña enviada", async () => {
    await pedir({ usuario, contrasena: "secreta-123-de-prueba" }, { ip: "10.2.0.3" });
    expect(lineas.length).toBeGreaterThan(0);
    expect(lineas.join("")).not.toContain("secreta-123-de-prueba");
  });

  it.each([
    ["sin usuario", { contrasena: clave }, "usuario"],
    ["sin contraseña", { usuario }, "contrasena"],
  ])("#20 CA-3: un cuerpo %s responde 400 con el detalle del campo", async (_caso, cuerpo, campo) => {
    const res = await pedir(cuerpo, { ip: "10.3.0.1" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Datos inválidos");
    expect(json.detalles.map((d: { campo: string }) => d.campo)).toContain(campo);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("#20 CA-3: un cuerpo que no es JSON responde 400 y no 500", async () => {
    const res = await pedir("esto no es json", { ip: "10.3.0.2" });
    expect(res.status).toBe(400);
  });

  it("#20 CA-3: los cuerpos inválidos no cuentan como intentos fallidos", async () => {
    for (let i = 0; i < 6; i++) await pedir({ contrasena: "x" }, { ip: "10.3.0.3" });
    const res = await pedir({ usuario, contrasena: clave }, { ip: "10.3.0.3" });
    expect(res.status).toBe(200);
  });

  it("#20 CA-4: al sexto intento fallido desde la misma IP responde 429 con Retry-After, aun con la clave correcta", async () => {
    for (let i = 0; i < 5; i++) {
      const fallo = await pedir({ usuario: `${prefijo}-ip-${i}`, contrasena: "mala" }, { ip: "10.4.0.1" });
      expect(fallo.status).toBe(401);
    }
    const res = await pedir({ usuario, contrasena: clave }, { ip: "10.4.0.1" });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect((await res.json()).error).toMatch(/intentos/);
  });

  it("#20 CA-4: al sexto intento fallido contra el mismo usuario responde 429 aunque cambie la IP", async () => {
    const objetivo = `${prefijo}-objetivo`;
    for (let i = 0; i < 5; i++) await pedir({ usuario: objetivo, contrasena: "mala" }, { ip: `10.5.0.${i}` });
    const res = await pedir({ usuario: objetivo, contrasena: "mala" }, { ip: "10.5.0.99" });
    expect(res.status).toBe(429);
  });
});
