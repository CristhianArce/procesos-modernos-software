import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatearFecha } from "@/modulos/dashboard/formato";
import type { LecturaHistorico } from "../repo";
import { TablaHistorico } from "../ui/TablaHistorico";

const lectura = (id: string, sensorNombre: string, tomadaEn: string): LecturaHistorico => ({
  id,
  sensorId: "s1",
  sensorNombre,
  nodoId: "n1",
  nodoNombre: "Subestación Norte",
  voltaje: 120.4,
  corriente: 9.8,
  potencia: 450,
  tomadaEn,
});

const render = (items: LecturaHistorico[]) => renderToStaticMarkup(createElement(TablaHistorico, { items })).replace(/<!-- -->/g, "");

describe("tabla del histórico", () => {
  it("#26 CA-1: muestra las filas en el orden recibido con nodo, sensor y magnitudes", () => {
    const html = render([
      lectura("l2", "Sensor B", "2026-03-10T12:00:00.000Z"),
      lectura("l1", "Sensor A", "2026-03-09T12:00:00.000Z"),
    ]);
    expect(html.match(/data-testid="fila-lectura"/g)).toHaveLength(2);
    expect(html.indexOf("Sensor B")).toBeGreaterThan(-1);
    expect(html.indexOf("Sensor B")).toBeLessThan(html.indexOf("Sensor A"));
    expect(html).toContain("Subestación Norte");
    expect(html).toContain("120,4 V");
    expect(html).toContain("9,8 A");
    expect(html).toContain("450 W");
    expect(html).toContain("cifra");
    expect(html).toContain(formatearFecha("2026-03-10T12:00:00.000Z"));
    for (const columna of ["Fecha", "Nodo", "Sensor", "Voltaje", "Corriente", "Potencia"]) expect(html).toContain(columna);
  });

  it("#26 CA-3: sin filas muestra Sin lecturas y no hay tabla", () => {
    const html = render([]);
    expect(html).toContain("Sin lecturas");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("fila-lectura");
  });
});
