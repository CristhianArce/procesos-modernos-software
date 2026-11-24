import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FiltrosHistorico } from "../ui/FiltrosHistorico";

const NODO_1 = "00000000-0000-4000-8000-000000000901";
const NODO_2 = "00000000-0000-4000-8000-000000000902";
const SENSOR_A = "00000000-0000-4000-8000-000000000911";

const nodos = [
  { id: NODO_1, nombre: "Nodo histórico demo" },
  { id: NODO_2, nombre: "Otro nodo" },
];
const sensores = [
  { id: SENSOR_A, nodoId: NODO_1, nombre: "Medidor histórico A" },
  { id: "00000000-0000-4000-8000-000000000912", nodoId: NODO_2, nombre: "Medidor otro" },
];

const html = (valores = {}) =>
  renderToStaticMarkup(createElement(FiltrosHistorico, { nodos, sensores, valores }));

describe("FiltrosHistorico", () => {
  it("#26 CA-2: es un formulario GET con data-testid filtros-historico", () => {
    const marcado = html();
    expect(marcado).toContain('data-testid="filtros-historico"');
    expect(marcado).toMatch(/<form[^>]*method="get"/i);
  });

  it("#26 CA-2: tiene etiquetas visibles asociadas a sus controles", () => {
    const marcado = html();
    for (const etiqueta of ["Nodo", "Sensor", "Desde", "Hasta"]) {
      const m = new RegExp(`<label[^>]*for="([^"]+)"[^>]*>\\s*${etiqueta}\\s*</label>`).exec(marcado);
      expect(m, `etiqueta ${etiqueta}`).not.toBeNull();
      expect(marcado).toContain(`id="${m![1]}"`);
    }
  });

  it("#26 CA-2: ofrece «Todos», los nodos y los sensores como «nodo · sensor»", () => {
    const marcado = html();
    expect(marcado).toContain("Todos");
    expect(marcado).toContain("Nodo histórico demo");
    expect(marcado).toContain("Otro nodo");
    expect(marcado).toContain("Nodo histórico demo · Medidor histórico A");
    expect(marcado).toContain("Otro nodo · Medidor otro");
  });

  it("#26 CA-2: marca como seleccionados y con valor los filtros actuales", () => {
    const marcado = html({ nodoId: NODO_1, sensorId: SENSOR_A, desde: "2026-01-10", hasta: "2026-01-12" });
    expect(marcado).toMatch(new RegExp(`<option[^>]*value="${NODO_1}"[^>]*selected|<option[^>]*selected[^>]*value="${NODO_1}"`));
    expect(marcado).toMatch(new RegExp(`<option[^>]*value="${SENSOR_A}"[^>]*selected|<option[^>]*selected[^>]*value="${SENSOR_A}"`));
    expect(marcado).toContain('value="2026-01-10"');
    expect(marcado).toContain('value="2026-01-12"');
  });

  it("#26 CA-2: trae los campos de fecha, el botón «Filtrar» y «Limpiar filtros»", () => {
    const marcado = html();
    expect(marcado).toMatch(/<input[^>]*type="date"/);
    expect(marcado).toContain("Filtrar");
    expect(marcado).toMatch(/<a[^>]*href="\/historico"[^>]*>\s*Limpiar filtros/);
  });
});
