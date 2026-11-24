import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 10", () => {
  it("#27 CA-1: la ficha recibe el panel Técnico asignado con orden 50, después de Afectados", () => {
    const titulos = registro.paneles.map((p) => p.titulo);
    expect(titulos).toContain("Técnico asignado");
    expect(titulos.indexOf("Afectados")).toBeLessThan(titulos.indexOf("Técnico asignado"));
    expect(registro.paneles.find((p) => p.titulo === "Técnico asignado")?.orden).toBe(50);
  });

  it("#27 CA-4: la página de la ficha no nombra al módulo mantenimiento", () => {
    const pagina = readFileSync("src/app/(tablero)/nodos/[id]/page.tsx", "utf8");
    expect(pagina).not.toMatch(/modulos\/mantenimiento/);
  });
});
