import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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

  const barra = (alertasActivas: number) =>
    renderToStaticMarkup(createElement(BarraSuperior, { rol: "tecnico", alertasActivas, conexion: "en-linea" }));

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
});
