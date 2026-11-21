import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { beforeAll, describe, expect, it } from "vitest";
import { COOKIE_SESION, firmarSesion } from "@/lib/session";
import { config, proxy } from "@/proxy";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

const pedir = (cookie?: string) =>
  new NextRequest("http://localhost/", cookie ? { headers: { cookie: `${COOKIE_SESION}=${cookie}` } } : undefined);

describe("proxy", () => {
  it("#2 CA-6: sin cookie redirige a /login", async () => {
    const res = await proxy(pedir());
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("#2 CA-6: con firma inválida redirige a /login", async () => {
    const res = await proxy(pedir("no.es.un-jwt"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("#2 CA-6: con sesión válida deja pasar", async () => {
    const res = await proxy(pedir(await firmarSesion({ sub: "u1", rol: "tecnico" })));
    expect(res.headers.get("location")).toBeNull();
  });

  it.each([
    ["/", true],
    ["/nodos/7", true],
    ["/api/health", false],
    ["/api/nodos", false],
    ["/login", false],
    ["/_next/static/x.js", false],
  ])("#2 CA-6: el matcher sobre %s es %s", (url, esperado) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(esperado);
  });
});
