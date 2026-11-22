import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("extensiones de la HU 4", () => {
  it("#21 CA-5: el menú ofrece Nodos al administrador y al técnico", () => {
    for (const rol of ["administrador", "tecnico"] as const) {
      expect(registro.menuPara(rol)).toContainEqual(expect.objectContaining({ etiqueta: "Nodos", href: "/nodos" }));
    }
  });

  it("#21 CA-7: la ficha recibe los paneles Sensores y Simulador, en ese orden", () => {
    const titulos = registro.paneles.map((p) => p.titulo);
    expect(titulos).toEqual(expect.arrayContaining(["Sensores", "Simulador"]));
    expect(titulos.indexOf("Sensores")).toBeLessThan(titulos.indexOf("Simulador"));
  });

  it("#21 CA-7: la página de la ficha muestra los paneles del registro sin nombrar a sus módulos", () => {
    const pagina = readFileSync("src/app/(tablero)/nodos/[id]/page.tsx", "utf8");
    expect(pagina).toContain("registro.paneles");
    expect(pagina).not.toMatch(/modulos\/(sensores|simulador|lecturas)/);
  });
});
