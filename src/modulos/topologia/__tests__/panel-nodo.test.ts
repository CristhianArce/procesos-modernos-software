import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DetalleNodo } from "@/modulos/estado/service";
import type { NodoMimico } from "../mimico";
import { ContenidoPanelNodo } from "../ui/PanelNodo";

const nodo: NodoMimico = {
  id: "n1",
  nombre: "Subestación Norte",
  tipo: "subestacion",
  x: 1,
  y: 1,
  sinUbicar: false,
  conexion: "conectado",
  nivel: "critico",
  voltaje: 130,
  corriente: 10,
  potencia: 1300,
  alertasActivas: 1,
};
const lectura = (voltaje: number) => ({ voltaje, corriente: 10, potencia: voltaje * 10, tomadaEn: "2026-11-22T15:00:00.000Z" });
const detalle: DetalleNodo = {
  id: "n1",
  sensores: [
    { id: "s1", nombre: "Transformador principal", umbralVoltaje: 125, umbralCorriente: 15, umbralPotencia: null, lecturas: [lectura(120), lectura(130)] },
    { id: "s2", nombre: "Línea de respaldo", umbralVoltaje: 128, umbralCorriente: null, umbralPotencia: null, lecturas: [] },
  ],
  alertas: [
    { id: "a1", nodoId: "n1", nodoNombre: "Subestación Norte", sensorNombre: "Transformador principal", magnitud: "voltaje", valor: 130, umbral: 125, creadaEn: "2026-11-22T15:00:00.000Z" },
  ],
};
const html = (d: DetalleNodo | null, error = false) =>
  renderToStaticMarkup(createElement(ContenidoPanelNodo, { nodo, detalle: d, error, onCerrar: () => {} }));

describe("panel lateral del nodo", () => {
  it("ui-scada: es una región con el nombre del nodo como título enfocable, su tipo, su estado y un botón de cerrar", () => {
    const h = html(detalle);
    expect(h).toMatch(/<h2[^>]*tabindex="-1"[^>]*>Subestación Norte<\/h2>/);
    expect(h).toContain("subestación");
    expect(h).toContain("Crítico");
    expect(h).toContain('aria-label="Cerrar panel"');
  });

  it("ui-scada: cada sensor con lecturas tiene medidores de tensión, corriente y potencia frente a sus umbrales", () => {
    const h = html(detalle);
    expect(h.match(/role="meter"/g)).toHaveLength(3);
    expect(h).toContain('aria-valuenow="130"');
    expect(h).toContain("Umbral 125 V");
  });

  it("ui-scada: cada sensor con lecturas tiene minigráficas de sus últimas lecturas; sin lecturas lo dice", () => {
    const h = html(detalle);
    expect(h.match(/role="img"[^>]*aria-label="[^"]*últimas lecturas/g)).toHaveLength(3);
    expect(h).toContain("Línea de respaldo");
    expect(h).toContain("Sin lecturas");
  });

  it("ui-scada: muestra sus alertas recientes y enlaza a la ficha completa", () => {
    const h = html(detalle);
    expect(h).toContain("130 V");
    expect(h).toContain('href="/nodos/n1"');
    expect(h).toContain("Ver ficha completa");
  });

  it("ui-scada: mientras carga y si falla lo dice", () => {
    expect(html(null)).toContain("Cargando");
    expect(html(null, true)).toContain("No se pudo cargar el detalle del nodo.");
  });
});
