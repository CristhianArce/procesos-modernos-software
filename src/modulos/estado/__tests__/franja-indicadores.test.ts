import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import type { Indicadores } from "../calculo";
import { FranjaIndicadores } from "../ui/FranjaIndicadores";

const base: Indicadores = {
  potenciaTotal: 2830.4,
  tensionMedia: 120.456,
  nodosConectados: 11,
  nodosDesconectados: 1,
  nodosTotales: 12,
  alertasActivas: 0,
  tendencia: { potencia: [2700, 2830], tension: [120, 121], nodos: [11, 11], alertas: [0, 0] },
};

const html = (k: Partial<Indicadores> = {}) => renderToStaticMarkup(createElement(FranjaIndicadores, { indicadores: { ...base, ...k } }));

describe("franja de indicadores", () => {
  it("ui-scada: formatea la potencia en W o kW y la tensión con un decimal, en español", () => {
    expect(formatoPotencia(950)).toBe("950 W");
    expect(formatoPotencia(2830.4)).toBe("2,83 kW");
    expect(formatoPotencia(null)).toBe("—");
    expect(formatoTension(120.456)).toBe("120,5 V");
  });

  it("ui-scada: muestra los cinco indicadores con su valor", () => {
    const h = html();
    for (const t of ["Potencia total", "Nodos conectados", "Nodos desconectados", "Alertas activas", "Tensión media"]) expect(h).toContain(t);
    expect(h).toContain("2,83 kW");
    expect(h).toContain("120,5 V");
    expect(h).toMatch(/>11<\/span>[\s\S]*de 12/);
  });

  it("ui-scada: cada indicador con historia lleva su minitendencia accesible; los demás dicen Sin historial", () => {
    expect(html().match(/role="img"/g)).toHaveLength(4);
    expect(html()).toContain("Sin historial");
    expect(html({ tendencia: { ...base.tendencia, potencia: [] } }).match(/role="img"/g)).toHaveLength(3);
  });

  it("ui-scada: las alertas activas y los nodos desconectados toman tono de estado", () => {
    const h = html({ alertasActivas: 4 });
    expect(h).toMatch(/data-tono="critico"[\s\S]*Alertas activas/);
    expect(h).toMatch(/data-tono="desconectado"[\s\S]*Nodos desconectados/);
    expect(html({ alertasActivas: 0, nodosDesconectados: 0 })).not.toMatch(/data-tono="(critico|desconectado)"/);
  });
});
