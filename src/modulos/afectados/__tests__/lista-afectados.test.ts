import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListaAfectados } from "../ui/ListaAfectados";

const html = (props: Parameters<typeof ListaAfectados>[0]) => renderToStaticMarkup(createElement(ListaAfectados, props));

describe("ListaAfectados", () => {
  const afectados = [
    { id: "1", alias: "Ana" },
    { id: "2", alias: "Ana" },
    { id: "3", alias: "Beto" },
  ];

  it("#25 CA-1: muestra el total en .cifra con su etiqueta", () => {
    const salida = html({ total: 3, afectados });
    expect(salida).toContain("Total de afectados");
    expect(salida).toMatch(/data-testid="afectados-total"[^>]*>\s*3\s*</);
    expect(salida).toMatch(/class="[^"]*cifra[^"]*"/);
  });

  it("#25 CA-1: pinta un afectado por alias en el orden recibido, incluidos repetidos", () => {
    const salida = html({ total: 3, afectados });
    expect(salida).toContain('data-testid="afectados-lista"');
    expect(salida.match(/data-testid="afectado"/g)).toHaveLength(3);
    const alias = [...salida.matchAll(/data-testid="afectado"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
    expect(alias).toEqual(["Ana", "Ana", "Beto"]);
  });

  it("#25 CA-3: con total 0 muestra el estado vacío y no pinta la lista", () => {
    const salida = html({ total: 0, afectados: [] });
    expect(salida).toContain("Este nodo no tiene afectados");
    expect(salida).not.toContain('data-testid="afectados-lista"');
  });
});
