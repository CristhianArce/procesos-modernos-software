import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next.config", () => {
  it("#2 decisión #1: publica las cabeceras de seguridad en todas las rutas", async () => {
    const reglas = await nextConfig.headers!();
    const todas = reglas.find((r) => r.source === "/:path*")!;
    const nombres = todas.headers.map((h) => h.key);
    expect(nombres).toEqual(
      expect.arrayContaining(["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options"]),
    );
    expect(todas.headers.find((h) => h.key === "Content-Security-Policy")!.value).toContain("frame-ancestors 'none'");
  });

  it("#2 decisión #1: genera la salida standalone y oculta X-Powered-By", () => {
    expect(nextConfig.output).toBe("standalone");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
