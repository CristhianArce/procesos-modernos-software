import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FiltrosHistorico } from "../ui/FiltrosHistorico";

const nodos = [
  { id: "00000000-0000-0000-0000-000000000301", nombre: "Subestación Norte" },
  { id: "00000000-0000-0000-0000-000000000302", nombre: "Subestación Sur" },
];
const sensores = [
  { id: "00000000-0000-0000-0000-000000000311", nombre: "Sensor de tensión", nodoNombre: "Subestación Norte" },
  { id: "00000000-0000-0000-0000-000000000321", nombre: "Sensor de corriente", nodoNombre: "Subestación Sur" },
];

const render = (valores: Record<string, string> = {}) =>
  renderToStaticMarkup(createElement(FiltrosHistorico, { nodos, sensores, valores })).replace(/<!-- -->/g, "");

describe("filtros del histórico", () => {
  it("#26 CA-2: es un formulario GET hacia /historico con sus cuatro campos etiquetados", () => {
    const html = render();
    expect(html).toMatch(/<form[^>]*method="get"/i);
    expect(html).toMatch(/<form[^>]*action="\/historico"/);
    for (const etiqueta of ["Nodo", "Sensor", "Desde (UTC)", "Hasta (UTC)"]) expect(html).toContain(etiqueta);
    for (const nombre of ["nodoId", "sensorId", "desde", "hasta"]) expect(html).toContain(`name="${nombre}"`);
  });

  it("#26 CA-2: tiene el botón Aplicar filtros y el enlace Limpiar filtros", () => {
    const html = render();
    expect(html).toContain("Aplicar filtros");
    expect(html).toMatch(/<a [^>]*href="\/historico"[^>]*>Limpiar filtros<\/a>/);
  });

  it("#26 CA-2: las opciones usan el identificador como valor y el sensor se muestra con su nodo", () => {
    const html = render();
    expect(html).toContain(`value="${nodos[0].id}"`);
    expect(html).toContain(`value="${sensores[1].id}"`);
    expect(html).toContain("Sensor de tensión · Subestación Norte");
    expect(html).toContain("Todos");
  });

  it("#26 CA-2: los campos de fecha llevan el ejemplo como marcador", () => {
    expect(render()).toContain('placeholder="2026-03-01T00:00:00Z"');
  });

  it("#26 CA-2: los valores aplicados salen seleccionados o escritos", () => {
    const html = render({
      nodoId: nodos[1].id,
      sensorId: sensores[0].id,
      desde: "2026-03-01T00:00:00Z",
      hasta: "2026-03-31T23:59:59Z",
    });
    expect(html).toMatch(new RegExp(`<option[^>]*value="${nodos[1].id}"[^>]*selected|<option[^>]*selected[^>]*value="${nodos[1].id}"`));
    expect(html).toMatch(new RegExp(`<option[^>]*value="${sensores[0].id}"[^>]*selected|<option[^>]*selected[^>]*value="${sensores[0].id}"`));
    expect(html).toContain('value="2026-03-01T00:00:00Z"');
    expect(html).toContain('value="2026-03-31T23:59:59Z"');
  });
});
