import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 6", () => {
  it("#23 CA-3: la ficha recibe el panel Aislamiento con orden 30, después de Simulador", () => {
    const titulos = registro.paneles.map((p) => p.titulo);
    expect(titulos).toContain("Aislamiento");
    expect(titulos.indexOf("Simulador")).toBeLessThan(titulos.indexOf("Aislamiento"));
    expect(registro.paneles.find((p) => p.titulo === "Aislamiento")?.orden).toBe(30);
  });

  it("#23 CA-3: la página de la ficha no nombra al módulo aislamiento", () => {
    const pagina = readFileSync("src/app/(tablero)/nodos/[id]/page.tsx", "utf8");
    expect(pagina).not.toMatch(/modulos\/aislamiento/);
  });
});
