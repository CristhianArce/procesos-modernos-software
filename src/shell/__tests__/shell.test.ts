import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AlertaReciente } from "@/modulos/estado/alarmas";
import { ProveedorEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import type { InstantaneaViva } from "@/modulos/estado/vivo";
import { ListaAvisos } from "../AvisosAlertas";
import { BarraSuperior } from "../BarraSuperior";
import { horaBogota } from "../hora";
import { iconoDeRuta } from "../iconos-menu";

// Fuera de Next no hay router montado: el botón de salir solo necesita que useRouter exista.
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace() {}, refresh() {} }) }));

describe("shell de la sala de control", () => {
  it("ui-scada: la hora del reloj es la de Bogotá con segundos", () => {
    expect(horaBogota(Date.parse("2026-11-22T15:30:05Z"))).toBe("10:30:05");
  });

  it("ui-scada: cada ruta conocida del menú tiene su icono y las demás uno genérico", () => {
    expect(iconoDeRuta("/dashboard")).toBe("dashboard");
    expect(iconoDeRuta("/nodos")).toBe("nodos");
    expect(iconoDeRuta("/historico")).toBe("generico");
  });

  const instantanea = (alertasActivas: number): InstantaneaViva => ({
    generadaEn: "2026-11-22T15:00:00.000Z",
    indicadores: { potenciaTotal: null, tensionMedia: null, nodosConectados: 0, nodosDesconectados: 0, nodosTotales: 0, alertasActivas, tendencia: { potencia: [], tension: [], nodos: [], alertas: [] } },
    nodos: [],
    alertas: [],
  });
  // La barra lee la conexión y las alertas del proveedor del estado en vivo.
  const barra = (alertasActivas: number) =>
    renderToStaticMarkup(createElement(ProveedorEstadoVivo, { inicial: instantanea(alertasActivas) } as ComponentProps<typeof ProveedorEstadoVivo>, createElement(BarraSuperior, { rol: "tecnico" })));

  it("ui-scada: la barra superior muestra la red, el reloj, la conexión y el rol", () => {
    const h = barra(0);
    expect(h).toContain("Red de distribución");
    expect(h).toContain("<time");
    expect(h).toContain("En línea");
    expect(h).toContain("Técnico");
  });

  it("ui-scada: con alertas activas la barra muestra el conteo en tono crítico y enlaza al dashboard", () => {
    const h = barra(3);
    expect(h).toMatch(/data-tono="critico"[^>]*>[\s\S]*3[\s\S]*alertas activas/);
    expect(h).toContain('href="/dashboard#alarmas"');
  });

  it("ui-scada: sin alertas activas el conteo queda en tono normal", () => {
    expect(barra(0)).toContain('data-tono="normal"');
  });

  const aviso = (id: string, valor: number): AlertaReciente => ({
    id,
    nodoId: "n1",
    nodoNombre: "Subestación Norte",
    sensorNombre: "Transformador principal",
    magnitud: "voltaje",
    valor,
    umbral: 125,
    creadaEn: "2026-11-22T15:00:00.000Z",
  });

  it("ui-scada: una alerta nueva sale como aviso con su nodo, sensor, valor, umbral y exceso, y se puede cerrar", () => {
    const h = renderToStaticMarkup(createElement(ListaAvisos, { avisos: [aviso("a", 140)], onCerrar: () => {} }));
    expect(h).toContain('role="status"');
    expect(h).toContain("Nueva alerta · Subestación Norte");
    expect(h).toContain("voltaje 140 V &gt; umbral 125 V (+12 %)");
    expect(h).toContain('data-estado="critico"');
    expect(h).toContain('aria-label="Cerrar aviso de Transformador principal"');
  });

  it("ui-scada: muestra como mucho tres avisos y dice cuántos más hay", () => {
    const h = renderToStaticMarkup(createElement(ListaAvisos, { avisos: ["a", "b", "c", "d", "e"].map((id) => aviso(id, 126)), onCerrar: () => {} }));
    expect(h.match(/Nueva alerta/g)).toHaveLength(3);
    expect(h).toContain("y 2 más en el panel de alarmas");
  });
});
