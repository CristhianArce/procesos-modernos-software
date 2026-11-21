import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as health } from "../health/route";
import { GET as metrics } from "../metrics/route";

const TOKEN = "token-de-prueba-123";
const pedir = (authorization?: string) =>
  new Request("http://localhost/api/metrics", authorization ? { headers: { authorization } } : undefined);

describe("GET /api/metrics", () => {
  beforeEach(() => void (process.env.METRICS_TOKEN = TOKEN));
  afterEach(() => void delete process.env.METRICS_TOKEN);

  it("#2 CA-3: sin cabecera responde 401 en JSON", async () => {
    const res = await metrics(pedir(), undefined);
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty("error");
  });

  it("#2 CA-3: con token incorrecto responde 401 en JSON", async () => {
    const res = await metrics(pedir("Bearer otro-token-cualquiera"), undefined);
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty("error");
  });

  it("#2 CA-3: sin METRICS_TOKEN definido responde 401 aunque llegue un token", async () => {
    delete process.env.METRICS_TOKEN;
    expect((await metrics(pedir(`Bearer ${TOKEN}`), undefined)).status).toBe(401);
  });

  it("#2 CA-3: con el token correcto responde las métricas de Prometheus, incluidas las HTTP", async () => {
    await health(new Request("http://localhost/api/health"), undefined);
    const res = await metrics(pedir(`Bearer ${TOKEN}`), undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toMatch(/http_requests_total\{metodo="GET",ruta="\/api\/health",estado="200"\} \d+/);
  });
});
