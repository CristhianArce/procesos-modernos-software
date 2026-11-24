import { afterEach, describe, expect, it, vi } from "vitest";
import { iniciarSimuladorContinuo } from "@/modulos/simulador/continuo";
import { register } from "../instrumentation";

vi.mock("@/modulos/simulador/continuo", () => ({ iniciarSimuladorContinuo: vi.fn() }));
const iniciar = vi.mocked(iniciarSimuladorContinuo);

afterEach(() => {
  vi.unstubAllEnvs();
  iniciar.mockReset();
});

describe("arranque del simulador continuo", () => {
  it("ui-scada: está apagado si SIM_AUTO_MS no está definida", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("SIM_AUTO_MS", "");
    await register();
    expect(iniciar).not.toHaveBeenCalled();
  });

  it("ui-scada: con SIM_AUTO_MS se enciende con ese intervalo en el runtime de Node", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("SIM_AUTO_MS", "2500");
    await register();
    expect(iniciar).toHaveBeenCalledWith(2500);
  });

  it("ui-scada: no se enciende en el runtime edge, durante el build ni con un intervalo inválido o menor que 500 ms", async () => {
    vi.stubEnv("SIM_AUTO_MS", "2500");
    vi.stubEnv("NEXT_RUNTIME", "edge");
    await register();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    await register();
    vi.stubEnv("NEXT_PHASE", "");
    for (const v of ["abc", "100"]) {
      vi.stubEnv("SIM_AUTO_MS", v);
      await register();
    }
    expect(iniciar).not.toHaveBeenCalled();
  });
});
