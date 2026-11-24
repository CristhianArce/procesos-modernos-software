import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 7", () => {
  it("#24 CA-1: el menú ofrece Notificaciones al técnico", () => {
    expect(registro.menuPara("tecnico")).toContainEqual(
      expect.objectContaining({ etiqueta: "Notificaciones", href: "/notificaciones" }),
    );
  });

  it("#24 CA-1: el menú no ofrece Notificaciones al administrador", () => {
    expect(registro.menuPara("administrador").map((i) => i.href)).not.toContain("/notificaciones");
  });

  it("#24 CA-3: el contrato declara 401 y 403 para GET /api/notificaciones", () => {
    const contrato = readFileSync("contracts/openapi.yaml", "utf8");
    const inicio = contrato.indexOf("/api/notificaciones:");
    expect(inicio).toBeGreaterThan(-1);
    const resto = contrato.slice(inicio + 1);
    const fin = resto.search(/^ {2}\/api\//m);
    const bloque = fin === -1 ? resto : resto.slice(0, fin);
    expect(bloque).toMatch(/get:/);
    expect(bloque).toMatch(/["']?200["']?:/);
    expect(bloque).toMatch(/["']?401["']?:/);
    expect(bloque).toMatch(/["']?403["']?:/);
  });
});
