import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatearFecha } from "@/modulos/dashboard/formato";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import type { HistoricoPagina, LecturaHistorico } from "../service";
import { TablaHistorico } from "../ui/TablaHistorico";

const NODO = "00000000-0000-4000-8000-000000000901";

const lectura = (id: string, sensorNombre: string, voltaje: number, tomadaEn: string): LecturaHistorico => ({
  id,
  nodoId: NODO,
  nodoNombre: "Nodo histórico demo",
  sensorId: "s-" + id,
  sensorNombre,
  voltaje,
  corriente: 5,
  potencia: 600,
  tomadaEn,
});

const reciente = lectura("l2", "Medidor histórico A", 122.5, "2026-01-12T15:00:00.000Z");
const antigua = lectura("l1", "Medidor histórico B", 119, "2026-01-12T13:00:00.000Z");

const resultado = (p: Partial<HistoricoPagina>): HistoricoPagina => ({
  pagina: 1,
  porPagina: 25,
  total: 26,
  totalPaginas: 2,
  lecturas: [reciente, antigua],
  ...p,
});

const html = (r: HistoricoPagina, filtros = {}) =>
  renderToStaticMarkup(createElement(TablaHistorico, { resultado: r, filtros }));

const filas = (marcado: string) => marcado.split('data-testid="lectura-historico"').slice(1);

describe("TablaHistorico", () => {
  it("#26 CA-1: una fila por lectura en el orden recibido", () => {
    const f = filas(html(resultado({})));
    expect(f).toHaveLength(2);
    expect(f[0]).toContain("Medidor histórico A");
    expect(f[1]).toContain("Medidor histórico B");
  });

  it("#26 CA-1: cada fila trae fecha, nodo, sensor y cifras con clase cifra", () => {
    const f = filas(html(resultado({})));
    expect(f[0]).toContain(formatearFecha(reciente.tomadaEn));
    expect(f[0]).toContain("Nodo histórico demo");
    for (const texto of [formatoTension(122.5), formatoCorriente(5), formatoPotencia(600)]) {
      expect(f[0]).toMatch(new RegExp(`class="[^"]*\\bcifra\\b[^"]*"[^>]*>[^<]*${texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    }
  });

  it("#26 CA-1: muestra los encabezados, el total y «Página 1 de 2»", () => {
    const marcado = html(resultado({}));
    expect(marcado).toContain('data-testid="tabla-historico"');
    for (const e of ["Fecha", "Nodo", "Sensor", "Voltaje", "Corriente", "Potencia"]) expect(marcado).toContain(e);
    expect(marcado.split('data-testid="historico-total"')[1].slice(0, 80)).toContain(">26<");
    expect(marcado).toContain("Página 1 de 2");
  });

  it("#26 CA-1: en la primera página no hay anterior y siguiente apunta a la página 2 con los filtros", () => {
    const marcado = html(resultado({}), { nodoId: NODO });
    expect(marcado).not.toContain('data-testid="pagina-anterior"');
    expect(marcado).toContain('data-testid="pagina-siguiente"');
    const enlace = marcado.split('data-testid="pagina-siguiente"')[1];
    expect(enlace).toContain(`nodoId=${NODO}`);
    expect(enlace).toContain("pagina=2");
  });

  it("#26 CA-1: en la última página no hay siguiente y anterior apunta a la página 1", () => {
    const marcado = html(resultado({ pagina: 2, lecturas: [antigua] }));
    expect(marcado).toContain("Página 2 de 2");
    expect(marcado).not.toContain('data-testid="pagina-siguiente"');
    expect(marcado).toContain('data-testid="pagina-anterior"');
    expect(marcado.split('data-testid="pagina-anterior"')[1]).toContain("pagina=1");
  });

  it("#26 CA-3: con total 0 muestra el estado vacío y no pinta la tabla", () => {
    const marcado = html(resultado({ total: 0, totalPaginas: 0, lecturas: [] }));
    expect(marcado).toContain("No hay lecturas con estos filtros");
    expect(marcado).toContain("Cambia los filtros o el rango de días.");
    expect(marcado).not.toContain('data-testid="tabla-historico"');
    expect(filas(marcado)).toHaveLength(0);
  });

  it("#26 CA-1: con lecturas no muestra el estado vacío", () => {
    expect(html(resultado({}))).not.toContain("No hay lecturas con estos filtros");
  });
});
