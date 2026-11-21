import { describe, expect, it } from "vitest";
import { obtenerAcerca } from "../service";

describe("servicio acerca", () => {
  it("#6 CA-1: devuelve nombre y version no vacíos", () => {
    const acerca = obtenerAcerca();

    expect(acerca.nombre.length).toBeGreaterThan(0);
    expect(acerca.version.length).toBeGreaterThan(0);
  });
});
