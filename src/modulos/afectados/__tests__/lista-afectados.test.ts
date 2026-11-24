import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListaAfectados } from "../ui/ListaAfectados";

const afectado = (n: number, alias: string) => ({
  id: `00000000-0000-4000-8000-0000000a000${n}`,
  alias,
  creadoEn: `2026-11-24T10:0${n}:00.000Z`,
});
const render = (afectados: ReturnType<typeof afectado>[]) =>
  renderToStaticMarkup(createElement(ListaAfectados, { total: afectados.length, afectados }));

// La ficha completa y el panel por rol se prueban con Playwright (e2e/afectados.spec.ts).
describe("lista de afectados", () => {
  it("#25 CA-1: con dos afectados muestra el total 2 y los dos alias en orden", () => {
    const html = render([afectado(1, "Alias Alfa"), afectado(2, "Alias Beta")]);
    expect(html).toMatch(/data-testid="total-afectados"[^>]*>\s*2\s*</);
    expect(html).toContain("Total de afectados");
    expect(html).toContain('aria-label="Afectados del nodo"');
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html.indexOf("Alias Alfa")).toBeGreaterThan(-1);
    expect(html.indexOf("Alias Alfa")).toBeLessThan(html.indexOf("Alias Beta"));
    expect(html).not.toContain("Sin afectados");
  });

  it("#25 CA-1: con alias repetidos muestra ambos y el total los cuenta", () => {
    const html = render([afectado(1, "Alias Repetido"), afectado(2, "Alias Repetido")]);
    expect(html.match(/Alias Repetido/g)).toHaveLength(2);
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toMatch(/data-testid="total-afectados"[^>]*>\s*2\s*</);
  });

  it("#25 CA-3: con total 0 muestra 0 y el estado vacío «Sin afectados»", () => {
    const html = render([]);
    expect(html).toMatch(/data-testid="total-afectados"[^>]*>\s*0\s*</);
    expect(html).toContain("Sin afectados");
    expect(html).not.toContain("<li");
  });
});
