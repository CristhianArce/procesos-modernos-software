import { describe, expect, it } from "vitest";
import { enlacePagina, filtrosDeBusqueda } from "../url";

describe("url del histórico", () => {
  it("#26 CA-2: filtrosDeBusqueda toma el primer valor de un arreglo", () => {
    expect(filtrosDeBusqueda({ nodoId: ["a", "b"], pagina: "2" })).toEqual({ nodoId: "a", pagina: "2" });
  });

  it("#26 CA-2: filtrosDeBusqueda descarta los vacíos y los undefined", () => {
    expect(filtrosDeBusqueda({ nodoId: "", sensorId: undefined, desde: "2026-03-01T00:00:00Z" })).toEqual({
      desde: "2026-03-01T00:00:00Z",
    });
  });

  it("#26 CA-2: enlacePagina conserva los filtros y agrega la página", () => {
    const url = new URL(enlacePagina({ nodoId: "n1", sensorId: "s1" }, 2), "http://x");
    expect(url.pathname).toBe("/historico");
    expect(url.searchParams.get("nodoId")).toBe("n1");
    expect(url.searchParams.get("sensorId")).toBe("s1");
    expect(url.searchParams.get("pagina")).toBe("2");
  });

  it("#26 CA-2: enlacePagina codifica los valores", () => {
    const enlace = enlacePagina({ desde: "2026-03-01T00:00:00Z" }, 3);
    expect(enlace.startsWith("/historico?")).toBe(true);
    expect(enlace).not.toContain(":");
    expect(new URL(enlace, "http://x").searchParams.get("desde")).toBe("2026-03-01T00:00:00Z");
  });
});
