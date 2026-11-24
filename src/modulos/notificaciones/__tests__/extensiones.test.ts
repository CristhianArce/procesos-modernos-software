import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 7", () => {
  it("#24 CA-1: el menú ofrece Notificaciones al técnico", () => {
    expect(registro.menuPara("tecnico")).toContainEqual(expect.objectContaining({ etiqueta: "Notificaciones", href: "/notificaciones" }));
  });

  it("#24 CA-1: el menú no ofrece Notificaciones al administrador", () => {
    expect(registro.menuPara("administrador").map((i) => i.etiqueta)).not.toContain("Notificaciones");
  });

  it("#24 CA-3: el contrato declara 401 y 403 para GET /api/notificaciones", () => {
    const contrato = readFileSync("contracts/openapi.yaml", "utf8");
    const inicio = contrato.indexOf("\n  /api/notificaciones:");
    expect(inicio).toBeGreaterThan(-1);
    const resto = contrato.slice(inicio + 1);
    const bloque = resto.slice(0, resto.search(/\n {2}\/api\/(?!notificaciones:)|\ncomponents:/) > 0 ? resto.search(/\n {2}\/api\/(?!notificaciones:)|\ncomponents:/) : undefined);
    expect(bloque).toMatch(/^ {4}get:/m);
    expect(bloque).toMatch(/"200":/);
    expect(bloque).toMatch(/"401":/);
    expect(bloque).toMatch(/"403":/);
    expect(contrato).toMatch(/^ {4}RespuestaNotificaciones:/m);
    expect(contrato).toMatch(/^ {4}Notificacion:/m);
  });
});
