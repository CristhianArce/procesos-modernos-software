import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { lineas } = vi.hoisted(() => ({ lineas: [] as string[] }));
vi.mock("@/lib/logger", async (original) => {
  const m = await original<typeof import("@/lib/logger")>();
  return { ...m, logger: m.crearLogger({ write: (s: string) => void lineas.push(s) }, "info") };
});

const { conHttp } = await import("@/lib/http");
const { ErrorHttp } = await import("@/lib/errores");

const post = (cuerpo: unknown) =>
  new Request("http://localhost/api/prueba", { method: "POST", body: JSON.stringify(cuerpo) });
const ultimaLinea = () => JSON.parse(lineas.at(-1)!);

describe("conHttp", () => {
  beforeEach(() => void (lineas.length = 0));

  it("#2 CA-5: registra método, ruta, estado y duración sin el cuerpo ni la contraseña", async () => {
    const handler = conHttp("/api/prueba", async (req) => {
      await req.json();
      return Response.json({ ok: true });
    });
    const res = await handler(post({ usuario: "ana", password: "secreta-123" }), undefined);
    expect(res.status).toBe(200);
    expect(lineas.join("")).not.toContain("secreta-123");
    expect(lineas.join("")).not.toContain("ana");
    expect(ultimaLinea()).toMatchObject({ metodo: "POST", ruta: "/api/prueba", estado: 200 });
    expect(typeof ultimaLinea().ms).toBe("number");
  });

  it("#2 CA-6: traduce ErrorHttp a JSON con su estado", async () => {
    const res = await conHttp("/api/prueba", () => {
      throw new ErrorHttp(403, "Sin permiso");
    })(post({}), undefined);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Sin permiso" });
  });

  it("#2 decisión #7: traduce un error de Zod a 400 con los campos inválidos", async () => {
    const res = await conHttp("/api/prueba", () => {
      z.object({ nombre: z.string() }).parse({});
      return Response.json({});
    })(post({}), undefined);
    expect(res.status).toBe(400);
    expect((await res.json()).detalles[0].campo).toBe("nombre");
  });

  it("#2 CA-5: convierte un error no controlado en 500 sin el detalle interno", async () => {
    const res = await conHttp("/api/prueba", () => {
      throw new Error("detalle interno: conexión a 10.0.0.5");
    })(post({}), undefined);
    expect(res.status).toBe(500);
    const cuerpo = await res.json();
    expect(cuerpo).toEqual({ error: "Error interno" });
    expect(ultimaLinea()).toMatchObject({ estado: 500 });
  });
});
