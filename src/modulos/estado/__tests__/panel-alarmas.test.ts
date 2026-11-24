import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AlertaReciente } from "../alarmas";
import { ListaAlarmas } from "../ui/PanelAlarmas";

const alerta = (id: string, extra: Partial<AlertaReciente>): AlertaReciente => ({
  id,
  nodoId: "n1",
  nodoNombre: "Subestación Norte",
  sensorNombre: "Transformador principal",
  magnitud: "voltaje",
  valor: 126,
  umbral: 125,
  creadaEn: "2026-11-22T15:00:00.000Z",
  ...extra,
});

const alertas = [
  alerta("media", { valor: 126, creadaEn: "2026-11-22T15:10:00.000Z" }),
  alerta("alta", { valor: 150, creadaEn: "2026-11-22T14:00:00.000Z", nodoId: "n2", nodoNombre: "Hospital General", sensorNombre: "Acometida", magnitud: "corriente", umbral: 12 }),
];
const html = (lista = alertas) => renderToStaticMarkup(createElement(ListaAlarmas, { alertas: lista, generadaEn: "2026-11-22T15:12:00.000Z" }));

describe("panel de alarmas", () => {
  it("ui-scada: ordena por severidad por defecto: la alta primero aunque sea más vieja", () => {
    const filas = html().match(/data-testid="alerta"[^>]*data-id="([^"]+)"/g)!;
    expect(filas.map((f) => f.match(/data-id="([^"]+)"/)![1])).toEqual(["alta", "media"]);
  });

  it("ui-scada: cada alarma muestra severidad, nodo, sensor, magnitud, valor, umbral y si sigue activa", () => {
    const h = html();
    expect(h).toContain("Alta +1150 %");
    expect(h).toContain("Media +1 %");
    expect(h).toContain("Hospital General");
    expect(h).toContain("Acometida");
    expect(h).toContain("150 A");
    expect(h).toContain("12 A");
    expect(h).toMatch(/data-id="media"[\s\S]*?Activa/);
  });

  it("ui-scada: trae filtros por nodo y por magnitud y el orden por severidad u hora", () => {
    const h = html();
    for (const t of ["Filtrar por nodo", "Filtrar por magnitud", "Ordenar por"]) expect(h).toContain(t);
    expect(h).toContain(">Hospital General</option>");
    expect(h).toContain(">Hora (más reciente primero)</option>");
  });

  it("ui-scada: sin alertas lo dice", () => {
    expect(html([])).toContain("Sin alertas");
  });
});
