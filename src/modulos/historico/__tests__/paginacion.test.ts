import { describe, expect, it } from "vitest";
import { enlacePagina } from "../paginacion";

const NODO = "00000000-0000-4000-8000-000000000901";
const SENSOR = "00000000-0000-4000-8000-000000000911";

const parsear = (enlace: string) => {
  const [ruta, consulta = ""] = enlace.split("?");
  return { ruta, params: new URLSearchParams(consulta) };
};

describe("enlacePagina", () => {
  it("#26 CA-1: sin filtros apunta a /historico con solo la página", () => {
    const { ruta, params } = parsear(enlacePagina({}, 2));
    expect(ruta).toBe("/historico");
    expect(params.get("pagina")).toBe("2");
    expect([...params.keys()]).toEqual(["pagina"]);
  });

  it("#26 CA-2: conserva los filtros presentes", () => {
    const { ruta, params } = parsear(
      enlacePagina({ nodoId: NODO, sensorId: SENSOR, desde: "2026-01-10", hasta: "2026-01-12" }, 2),
    );
    expect(ruta).toBe("/historico");
    expect(params.get("nodoId")).toBe(NODO);
    expect(params.get("sensorId")).toBe(SENSOR);
    expect(params.get("desde")).toBe("2026-01-10");
    expect(params.get("hasta")).toBe("2026-01-12");
    expect(params.get("pagina")).toBe("2");
  });

  it("#26 CA-2: omite los filtros ausentes", () => {
    const { params } = parsear(enlacePagina({ nodoId: NODO }, 3));
    expect(params.get("nodoId")).toBe(NODO);
    expect(params.has("sensorId")).toBe(false);
    expect(params.has("desde")).toBe(false);
    expect(params.has("hasta")).toBe(false);
    expect(params.get("pagina")).toBe("3");
  });
});
