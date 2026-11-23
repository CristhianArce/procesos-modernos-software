import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DatosMimico } from "../mimico";
import { Mimico } from "../ui/Mimico";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {} }) }));

const datos: DatosMimico = {
  nodos: [
    { id: "g", nombre: "Central Oriente", tipo: "generacion", x: 100, y: 200, sinUbicar: false, conexion: "conectado", nivel: "normal", voltaje: 121, corriente: 15, potencia: 3000, alertasActivas: 0 },
    { id: "c", nombre: "Hospital", tipo: "carga", x: 700, y: 200, sinUbicar: false, conexion: "conectado", nivel: "critico", voltaje: 130, corriente: 5, potencia: 650, alertasActivas: 2 },
    { id: "d", nombre: "Laureles", tipo: "alimentador", x: 400, y: 400, sinUbicar: true, conexion: "desconectado", nivel: "desconectado", voltaje: null, corriente: null, potencia: null, alertasActivas: 0 },
  ],
  enlaces: [
    { id: "e1", x1: 100, y1: 200, x2: 700, y2: 200, activo: true, flujo: { grosor: 3, duracionS: 2 } },
    { id: "e2", x1: 100, y1: 200, x2: 400, y2: 400, activo: false, flujo: null },
  ],
};

const html = () => renderToStaticMarkup(createElement(Mimico, { datos }));

describe("mímico de la red", () => {
  it("ui-scada: es un grupo con nombre y un resumen en texto para lectores de pantalla", () => {
    const h = html();
    expect(h).toContain('aria-label="Mímico de la red eléctrica"');
    expect(h).toContain("3 nodos: 2 conectados, 1 desconectado; 1 en estado crítico");
  });

  it("ui-scada: cada nodo es un botón enfocable con nombre, tipo, estado y potencia", () => {
    const h = html();
    expect(h.match(/role="button" tabindex="0"/g)).toHaveLength(3);
    expect(h).toContain('aria-label="Hospital, carga, Crítico, 650 W, 2 alertas activas"');
    expect(h).toContain('aria-label="Central Oriente, generación, Normal, 3 kW"');
  });

  it("ui-scada: cada nodo pinta el símbolo de su tipo y lleva el color de su estado", () => {
    const h = html();
    expect(h).toMatch(/data-estado="critico"[^>]*data-tipo="carga"/);
    expect(h).toMatch(/data-tipo="generacion"/);
  });

  it("ui-scada: un enlace activo lleva flujo animado con su grosor y duración; uno inactivo, sin flujo", () => {
    const h = html();
    expect(h).toMatch(/class="mimico-flujo"[^>]*stroke-width="1.8"[^>]*style="--duracion:2s"/);
    expect(h.match(/class="mimico-flujo"/g)).toHaveLength(1);
    expect(h).toContain('data-activo="false"');
  });

  it("ui-scada: un nodo sin ubicar lo dice en su etiqueta", () => {
    expect(html()).toContain("sin ubicar");
  });

  it("ui-scada: trae controles para acercar, alejar y encuadrar todo", () => {
    const h = html();
    for (const t of ["Acercar", "Alejar", "Encuadrar toda la red"]) expect(h).toContain(`aria-label="${t}"`);
  });
});
