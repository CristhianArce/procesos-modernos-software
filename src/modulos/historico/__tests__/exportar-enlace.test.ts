import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HistoricoPagina, LecturaHistorico } from "../service";
import { TablaHistorico } from "../ui/TablaHistorico";

const NODO = "00000000-0000-4000-8000-000000000901";

const lectura: LecturaHistorico = {
  id: "l2",
  nodoId: NODO,
  nodoNombre: "Nodo histórico demo",
  sensorId: "s-l2",
  sensorNombre: "Medidor histórico A",
  voltaje: 122.5,
  corriente: 5,
  potencia: 600,
  tomadaEn: "2026-01-12T15:00:00.000Z",
};

const conResultados: HistoricoPagina = { pagina: 1, porPagina: 25, total: 1, totalPaginas: 1, lecturas: [lectura] };
const sinResultados: HistoricoPagina = { pagina: 1, porPagina: 25, total: 0, totalPaginas: 0, lecturas: [] };

const html = (r: HistoricoPagina, filtros = {}) =>
  renderToStaticMarkup(createElement(TablaHistorico, { resultado: r, filtros }));

const etiquetaEnlace = (marcado: string) => {
  const m = marcado.match(/<a[^>]*data-testid="exportar-csv"[^>]*>[^<]*<\/a>/);
  expect(m).not.toBeNull();
  return m![0];
};

describe("enlace Exportar CSV de TablaHistorico", () => {
  it("#56 CA-1: con resultados muestra el enlace con download y href con los filtros aplicados", () => {
    const a = etiquetaEnlace(html(conResultados, { nodoId: NODO, desde: "2026-01-10", hasta: "2026-01-12" }));
    expect(a).toContain("Exportar CSV");
    expect(a).toMatch(/\sdownload(=""|\s|>)/);
    expect(a).toContain(`href="/api/historico/exportar?nodoId=${NODO}&amp;desde=2026-01-10&amp;hasta=2026-01-12"`);
    expect(a).not.toContain("pagina");
  });

  it("#56 CA-1: sin filtros el href es la ruta sin ?", () => {
    expect(etiquetaEnlace(html(conResultados))).toContain('href="/api/historico/exportar"');
  });

  it("#56 CA-2: sin resultados también muestra el enlace Exportar CSV junto al estado vacío", () => {
    const marcado = html(sinResultados, { desde: "2030-01-01" });
    expect(marcado).toContain("No hay lecturas con estos filtros");
    const a = etiquetaEnlace(marcado);
    expect(a).toContain("Exportar CSV");
    expect(a).toContain("download");
    expect(a).toContain('href="/api/historico/exportar?desde=2030-01-01"');
  });
});
