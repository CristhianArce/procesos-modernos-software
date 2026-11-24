import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 8", () => {
  it("#25 CA-1: la ficha recibe el panel Afectados con orden 40, después de Aislamiento", () => {
    const titulos = registro.paneles.map((p) => p.titulo);
    expect(titulos).toContain("Afectados");
    expect(titulos).toContain("Aislamiento");
    expect(titulos.indexOf("Aislamiento")).toBeLessThan(titulos.indexOf("Afectados"));
    expect(registro.paneles.find((p) => p.titulo === "Afectados")?.orden).toBe(40);
  });

  it("#25 CA-2: la página de la ficha no nombra al módulo afectados", () => {
    const pagina = readFileSync("src/app/(tablero)/nodos/[id]/page.tsx", "utf8");
    expect(pagina).not.toMatch(/modulos\/afectados/);
  });
});
