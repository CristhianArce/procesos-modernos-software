import { describe, expect, it, vi } from "vitest";

describe("metrics", () => {
  it("#2 CA-3: importar dos veces no duplica el registro", async () => {
    const a = await import("@/lib/metrics");
    vi.resetModules();
    const b = await import("@/lib/metrics");
    expect(b.metricas.registro).toBe(a.metricas.registro);
  });

  it("#2 CA-3: registrarPeticion sube el contador con método, ruta y estado", async () => {
    const { metricas, registrarPeticion } = await import("@/lib/metrics");
    registrarPeticion("GET", "/api/prueba-metricas", 200, 0.01);
    const texto = await metricas.registro.metrics();
    expect(texto).toMatch(/http_requests_total\{metodo="GET",ruta="\/api\/prueba-metricas",estado="200"\} 1/);
  });
});
