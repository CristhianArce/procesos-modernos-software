import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construirRegistro, registro, type ExtensionesModulo } from "@/nav/registro";

// Módulo de prueba: solo existe en esta prueba, el núcleo no lo conoce (CA-4).
const moduloPrueba: ExtensionesModulo = {
  menu: { etiqueta: "Prueba", href: "/prueba", roles: ["administrador"], orden: 50 },
  paneles: [{ titulo: "Panel de prueba", orden: 1, Componente: () => null }],
  onAlerta: { manejar: () => {} },
};
const otro: ExtensionesModulo = {
  menu: { etiqueta: "Otro", href: "/otro", roles: ["administrador", "tecnico"], orden: 10 },
};

describe("registro de extensiones", () => {
  const r = construirRegistro({ "modulo-prueba": moduloPrueba, otro });

  it("#2 CA-4: aparecen el ítem, el panel y el suscriptor del módulo", () => {
    expect(r.menu.map((i) => i.etiqueta)).toContain("Prueba");
    expect(r.paneles.map((p) => p.titulo)).toEqual(["Panel de prueba"]);
    expect(r.suscriptores.map((s) => s.modulo)).toEqual(["modulo-prueba"]);
  });

  it("#2 CA-4: el menú sale ordenado por orden", () => {
    expect(r.menu.map((i) => i.etiqueta)).toEqual(["Otro", "Prueba"]);
  });

  it("#2 CA-4: un ítem solo para administrador no aparece para tecnico", () => {
    expect(r.menuPara("tecnico").map((i) => i.etiqueta)).toEqual(["Otro"]);
    expect(r.menuPara("administrador").map((i) => i.etiqueta)).toEqual(["Otro", "Prueba"]);
  });

  it("#2 CA-4: descubre los menu.ts reales de src/modulos sin editar el núcleo", () => {
    expect(registro.menuPara("tecnico").map((i) => i.href)).toContain("/");
  });

  it("#2 CA-4: ningún archivo del núcleo nombra un módulo", () => {
    const nucleo = ["src/lib", "src/nav", "src/proxy.ts", "src/app/(tablero)/layout.tsx"];
    const modulos = readdirSync("src/modulos");
    const archivos = (ruta: string): string[] =>
      statSync(ruta).isDirectory()
        ? readdirSync(ruta).filter((f) => f !== "__tests__").flatMap((f) => archivos(join(ruta, f)))
        : [ruta];
    for (const archivo of nucleo.flatMap(archivos)) {
      const texto = readFileSync(archivo, "utf8");
      for (const m of modulos) expect(texto, `${archivo} nombra el módulo ${m}`).not.toMatch(new RegExp(`modulos/${m}\\b`));
    }
  });
});
