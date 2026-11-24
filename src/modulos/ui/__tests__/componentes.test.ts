import { createElement, type ComponentProps, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IndicadorEstado } from "../IndicadorEstado";
import { Insignia } from "../Insignia";
import { Medidor } from "../Medidor";
import { Sparkline } from "../Sparkline";
import { Tarjeta } from "../Tarjeta";

const html = (el: ReactElement) => renderToStaticMarkup(el);

describe("componentes base", () => {
  it("ui-scada: el indicador de estado lleva forma y texto, no solo color", () => {
    const h = html(createElement(IndicadorEstado, { estado: "critico" }));
    expect(h).toContain('data-estado="critico"');
    expect(h).toContain("<polygon"); // octágono
    expect(h).toContain("Crítico");
  });

  it("ui-scada: el indicador acepta una etiqueta propia", () => {
    expect(html(createElement(IndicadorEstado, { estado: "desconectado", etiqueta: "Fuera de línea" }))).toContain("Fuera de línea");
  });

  it("ui-scada: la insignia usa el tono del estado", () => {
    const h = html(createElement(Insignia, { tono: "advertencia" } as ComponentProps<typeof Insignia>, "3 alertas"));
    expect(h).toContain('data-tono="advertencia"');
    expect(h).toContain("3 alertas");
  });

  it("ui-scada: la tarjeta tiene título como encabezado y su contenido", () => {
    const h = html(createElement(Tarjeta, { titulo: "Potencia total" } as ComponentProps<typeof Tarjeta>, "hola"));
    expect(h).toMatch(/<h2[^>]*>Potencia total<\/h2>/);
    expect(h).toContain("hola");
  });

  it("ui-scada: el medidor es un meter accesible con valor, umbral y nivel", () => {
    const h = html(createElement(Medidor, { etiqueta: "Tensión", valor: 130, umbral: 125, unidad: "V" }));
    expect(h).toContain('role="meter"');
    expect(h).toContain('aria-valuenow="130"');
    expect(h).toContain('aria-valuemax="156.25"');
    expect(h).toContain('data-estado="critico"');
    expect(h).toContain("130 V");
    expect(h).toContain("Umbral 125 V");
  });

  it("ui-scada: el medidor sin lectura dice Sin datos", () => {
    const h = html(createElement(Medidor, { etiqueta: "Corriente", valor: null, umbral: 15, unidad: "A" }));
    expect(h).toContain("Sin datos");
    expect(h).not.toContain("aria-valuenow");
  });

  it("ui-scada: la minigráfica es una imagen con texto alternativo y su trazo", () => {
    const h = html(createElement(Sparkline, { valores: [1, 2, 3], etiqueta: "Potencia reciente" }));
    expect(h).toContain('role="img"');
    expect(h).toContain('aria-label="Potencia reciente"');
    expect(h).toMatch(/<path[^>]*d="M/);
  });

  it("ui-scada: la minigráfica sin datos suficientes no dibuja trazo", () => {
    expect(html(createElement(Sparkline, { valores: [1], etiqueta: "x" }))).not.toContain("<path");
  });
});

describe("gráfica de línea", () => {
  it("ui-scada: es una imagen con texto alternativo, el trazo y el mínimo y el máximo de la serie", async () => {
    const { GraficaLinea } = await import("../GraficaLinea");
    const h = html(createElement(GraficaLinea, { valores: [118.2, 121.5, 120], etiqueta: "Voltaje (V)" }));
    expect(h).toContain('role="img"');
    expect(h).toContain('aria-label="Voltaje (V): de 118,2 a 121,5, última 120"');
    expect(h).toMatch(/<path[^>]*d="M/);
    expect(h).toContain(">121,5<");
    expect(h).toContain(">118,2<");
  });
});
