import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FilaHistorico } from "../repo";
import { FiltrosHistorico } from "../ui/FiltrosHistorico";
import { PaginacionHistorico } from "../ui/PaginacionHistorico";
import { TablaHistorico } from "../ui/TablaHistorico";

const fila = (n: number, extra: Partial<FilaHistorico> = {}): FilaHistorico => ({
  id: `l-${n}`,
  sensorId: "s1",
  sensorNombre: `Sensor ${n}`,
  nodoId: "n1",
  nodoNombre: "Nodo Norte",
  voltaje: 230.5,
  corriente: 10.2,
  potencia: 2150,
  tomadaEn: `2026-11-22T10:${String(59 - n).padStart(2, "0")}:00.000Z`,
  ...extra,
});

describe("TablaHistorico", () => {
  it("#26 CA-1: pinta una fila por lectura, en el orden recibido", () => {
    const items = Array.from({ length: 25 }, (_, i) => fila(i));
    const html = renderToStaticMarkup(createElement(TablaHistorico, { items }));
    expect(html).toContain('data-testid="tabla-historico"');
    expect(html.match(/data-testid="fila-historico"/g)).toHaveLength(25);
    expect(html.indexOf("Sensor 0")).toBeGreaterThan(-1);
    expect(html.indexOf("Sensor 0")).toBeLessThan(html.indexOf("Sensor 5"));
    expect(html.indexOf("Sensor 5")).toBeLessThan(html.indexOf("Sensor 24"));
  });

  it("#26 CA-1: muestra nodo, sensor y las cifras con formato y unidades", () => {
    const html = renderToStaticMarkup(createElement(TablaHistorico, { items: [fila(0)] }));
    expect(html).toContain("Nodo Norte");
    expect(html).toContain("Sensor 0");
    expect(html).toContain("230,5 V");
    expect(html).toContain("10,2 A");
    expect(html).toContain("2,15 kW");
    expect(html).toContain("cifra");
  });

  it("#26 CA-1: las cabeceras son Fecha, Nodo, Sensor, Tensión, Corriente y Potencia", () => {
    const html = renderToStaticMarkup(createElement(TablaHistorico, { items: [fila(0)] }));
    for (const titulo of ["Fecha", "Nodo", "Sensor", "Tensión", "Corriente", "Potencia"]) {
      expect(html).toContain(titulo);
    }
  });
});

describe("PaginacionHistorico", () => {
  const pintar = (pagina: number, total: number, params = "") =>
    renderToStaticMarkup(
      createElement(PaginacionHistorico, { pagina, total, tamano: 25, parametros: new URLSearchParams(params) }),
    );

  it("#26 CA-1: con 26 lecturas la primera página dice «Página 1 de 2 · 26 lecturas»", () => {
    const html = pintar(1, 26);
    expect(html).toContain('aria-label="Paginación del histórico"');
    expect(html).toContain('data-testid="resumen-pagina"');
    expect(html).toContain("Página 1 de 2");
    expect(html).toContain("26 lecturas");
  });

  it("#26 CA-1: en la primera página Siguiente es enlace y Anterior es solo texto", () => {
    const html = pintar(1, 26);
    expect(html).toMatch(/<a[^>]*href="[^"]*pagina=2[^"]*"[^>]*>\s*Siguiente/);
    expect(html).toContain("Anterior");
    expect(html).not.toMatch(/<a[^>]*>\s*Anterior/);
  });

  it("#26 CA-1: en la última página Anterior es enlace y Siguiente es solo texto", () => {
    const html = pintar(2, 26);
    expect(html).toContain("Página 2 de 2");
    expect(html).toMatch(/<a[^>]*href="[^"]*pagina=1[^"]*"[^>]*>\s*Anterior/);
    expect(html).toContain("Siguiente");
    expect(html).not.toMatch(/<a[^>]*>\s*Siguiente/);
  });

  it("#26 CA-2: los enlaces conservan los filtros activos", () => {
    const html = pintar(1, 26, "nodoId=n1&sensorId=s1");
    expect(html).toMatch(/<a[^>]*href="[^"]*nodoId=n1[^"]*"/);
    expect(html).toMatch(/<a[^>]*href="[^"]*sensorId=s1[^"]*"/);
  });
});

describe("FiltrosHistorico", () => {
  const nodos = [
    { id: "n1", nombre: "Nodo Norte" },
    { id: "n2", nombre: "Nodo Sur" },
  ];
  const sensores = [
    { id: "s1", nombre: "Sensor A", nodoId: "n1" },
    { id: "s2", nombre: "Sensor B", nodoId: "n2" },
  ];
  const pintar = (valores: Parameters<typeof FiltrosHistorico>[0]["valores"]) =>
    renderToStaticMarkup(createElement(FiltrosHistorico, { nodos, sensores, valores }));

  it("#26 CA-2: es un formulario GET con los cuatro campos etiquetados", () => {
    const html = pintar({});
    expect(html).toContain('aria-label="Filtros del histórico"');
    expect(html).toMatch(/<form[^>]*method="get"/i);
    for (const etiqueta of ["Nodo", "Sensor", "Desde", "Hasta"]) {
      expect(html).toContain(etiqueta);
    }
    for (const nombre of ["nodoId", "sensorId", "desde", "hasta"]) {
      expect(html).toContain(`name="${nombre}"`);
    }
    expect(html).toContain("Nodo Norte");
    expect(html).toContain("Sensor B");
  });

  it("#26 CA-2: los valores recibidos quedan en los campos", () => {
    const html = pintar({
      nodoId: "n2",
      sensorId: "s2",
      desde: "2026-11-01T00:00:00Z",
      hasta: "2026-11-02T00:00:00Z",
    });
    expect(html).toMatch(/<option[^>]*value="n2"[^>]*selected/);
    expect(html).toMatch(/<option[^>]*value="s2"[^>]*selected/);
    expect(html).not.toMatch(/<option[^>]*value="n1"[^>]*selected/);
    expect(html).toContain('value="2026-11-01T00:00:00Z"');
    expect(html).toContain('value="2026-11-02T00:00:00Z"');
  });

  it("#26 CA-2: ofrece Aplicar filtros y Limpiar filtros hacia /historico", () => {
    const html = pintar({});
    expect(html).toContain("Aplicar filtros");
    expect(html).toMatch(/<a[^>]*href="\/historico"[^>]*>\s*Limpiar filtros/);
  });
});
