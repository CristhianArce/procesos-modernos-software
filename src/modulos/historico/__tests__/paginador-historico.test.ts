import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaginadorHistorico } from "../ui/PaginadorHistorico";

const render = (pagina: number, total: number, filtros: Record<string, string> = {}) =>
  renderToStaticMarkup(createElement(PaginadorHistorico, { pagina, total, porPagina: 25, filtros })).replace(/<!-- -->/g, "");

const enlace = (html: string, texto: string) => html.match(new RegExp(`<a [^>]*href="([^"]*)"[^>]*>${texto}</a>`))?.[1];

describe("paginador del histórico", () => {
  it("#26 CA-1: muestra Página 1 de 2 y 26 lecturas dentro del nav con nombre", () => {
    const html = render(1, 26);
    expect(html).toContain('aria-label="Paginación del histórico"');
    expect(html).toMatch(/data-testid="pagina-actual"[^>]*>Página 1 de 2</);
    expect(html).toMatch(/data-testid="total-historico"[^>]*>26 lecturas</);
  });

  it("#26 CA-1: en la primera página Anterior no es enlace y Siguiente lleva a pagina=2 con los filtros", () => {
    const html = render(1, 26, { nodoId: "n1" });
    expect(html).toContain("Anterior");
    expect(enlace(html, "Anterior")).toBeUndefined();
    const siguiente = enlace(html, "Siguiente")?.replace(/&amp;/g, "&");
    expect(siguiente).toBeDefined();
    expect(siguiente).toContain("pagina=2");
    expect(siguiente).toContain("nodoId=n1");
  });

  it("#26 CA-1: en la última página Siguiente no es enlace y Anterior lleva a pagina=1", () => {
    const html = render(2, 26, { nodoId: "n1" });
    expect(html).toContain("Siguiente");
    expect(enlace(html, "Siguiente")).toBeUndefined();
    const anterior = enlace(html, "Anterior")?.replace(/&amp;/g, "&");
    expect(anterior).toBeDefined();
    expect(anterior).toContain("pagina=1");
    expect(anterior).toContain("nodoId=n1");
  });

  it("#26 CA-3: con 0 lecturas muestra Página 1 de 1", () => {
    const html = render(1, 0);
    expect(html).toMatch(/data-testid="pagina-actual"[^>]*>Página 1 de 1</);
    expect(html).toMatch(/data-testid="total-historico"[^>]*>0 lecturas</);
  });
});
