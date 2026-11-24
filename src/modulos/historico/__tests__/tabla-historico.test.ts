import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TablaHistorico } from "../ui/TablaHistorico";

const fila = (id: string, voltaje: number) => ({
  id,
  sensorId: "s1",
  nodoId: "n1",
  nodoNombre: "Subestación Norte",
  sensorNombre: "Sensor de tensión",
  voltaje,
  corriente: 9.8,
  potencia: 1179.92,
  tomadaEn: "2026-11-24T15:30:05.000Z",
});

const render = (filas: ReturnType<typeof fila>[]) => renderToStaticMarkup(createElement(TablaHistorico, { filas }));

describe("tabla del histórico", () => {
  it("#26 CA-3: sin filas muestra el estado vacío en lugar de la tabla", () => {
    const html = render([]);
    expect(html).toContain("<h2");
    expect(html).not.toContain("<table");
  });

  it("#26 CA-1: con filas muestra nodo, sensor y las cifras con formato", () => {
    const html = render([fila("l1", 120.4), fila("l2", 118)]);
    expect(html).toContain("<table");
    expect(html).toContain("Subestación Norte");
    expect(html).toContain("Sensor de tensión");
    expect(html).toContain("120,4 V");
    expect(html).toContain("118 V");
    expect(html).toContain("9,8 A");
    expect(html).toContain("1,18 kW");
    expect(html).toContain("cifra");
  });

  it("#26 CA-1: conserva el orden recibido, la más reciente primero", () => {
    const html = render([fila("l1", 120.4), fila("l2", 118)]);
    expect(html.indexOf("120,4 V")).toBeLessThan(html.indexOf("118 V"));
  });
});
