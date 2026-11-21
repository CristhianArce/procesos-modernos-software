import { describe, expect, it } from "vitest";
import { GET } from "../../../app/api/acerca/route";

describe("ruta /api/acerca", () => {
  it("#6 CA-3: la ruta sin sesión responde 401", async () => {
    const respuesta = await GET(new Request("http://localhost/api/acerca"));

    expect(respuesta.status).toBe(401);
  });
});
