import { describe, expect, it } from "vitest";
import paquete from "../../../../package.json";
import { GET } from "../health/route";

describe("GET /api/health", () => {
  it("#2 CA-2: responde 200 en JSON con status ok y la versión de la app, sin autenticación", async () => {
    const res = await GET(new Request("http://localhost/api/health"), undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ status: "ok", version: paquete.version });
  });
});
