import { describe, expect, it } from "vitest";
import { crearLogger } from "@/lib/logger";

describe("logger", () => {
  it("#2 CA-5: redacta contraseñas, tokens y cabeceras sensibles", () => {
    const lineas: string[] = [];
    const log = crearLogger({ write: (s: string) => void lineas.push(s) }, "info");
    log.info({ password: "secreta-123", datos: { authorization: "Bearer abc", token: "t0k3n" } }, "prueba");
    const linea = lineas.join("");
    expect(linea).not.toContain("secreta-123");
    expect(linea).not.toContain("Bearer abc");
    expect(linea).not.toContain("t0k3n");
    expect(linea).toContain("[redactado]");
  });
});
