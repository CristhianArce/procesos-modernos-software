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
    { id: "e1", etiqueta: "Central Oriente → Hospital", x1: 100, y1: 200, x2: 700, y2: 200, activo: true, flujo: { grosor: 3, duracionS: 2 } },
    { id: "e2", etiqueta: "Central Oriente → Laureles", x1: 100, y1: 200, x2: 400, y2: 400, activo: false, flujo: null },
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

describe("mímico en vivo", () => {
  it("ui-scada: un nodo con alerta nueva parpadea y el nodo abierto queda marcado como seleccionado", () => {
    const vivo: DatosMimico = { ...datos, nodos: datos.nodos.map((n) => ({ ...n, parpadeo: n.id === "c" })) };
    const h = renderToStaticMarkup(createElement(Mimico, { datos: vivo, seleccionado: "g" }));
    const etiqueta = (nombre: string) => h.match(new RegExp(`<g role="button"[^>]*aria-label="${nombre}[^>]*>`))![0];
    expect(etiqueta("Hospital")).toContain('data-parpadeo="true"');
    expect(h.match(/data-parpadeo="true"/g)).toHaveLength(1);
    expect(etiqueta("Central Oriente")).toContain('aria-expanded="true"');
    expect(etiqueta("Hospital")).toContain('aria-expanded="false"');
  });
});

describe("mímico en modo edición", () => {
  const edicion = {
    origen: "g",
    enlaceSeleccionado: "e1",
    onMoverNodo() {},
    onDesplazarNodo() {},
    onElegirNodo() {},
    onElegirEnlace() {},
  };
  const conNombres: DatosMimico = { ...datos, enlaces: datos.enlaces.map((e) => ({ ...e, etiqueta: `${e.id} origen → destino` })) };
  const h = () => renderToStaticMarkup(createElement(Mimico, { datos: conNombres, edicion }));

  it("ui-scada: explica cómo editar y cada nodo enlaza a esa explicación", () => {
    const html = h();
    expect(html).toContain("Modo edición");
    expect(html.match(/aria-describedby="mimico-ayuda-edicion"/g)).toHaveLength(3);
  });

  it("ui-scada: cada enlace es un botón enfocable con su origen y destino; el seleccionado lo indica", () => {
    const html = h();
    expect(html).toMatch(/role="button" tabindex="0" aria-label="Enlace e1 origen → destino" aria-pressed="true"/);
    expect(html).toMatch(/role="button" tabindex="0" aria-label="Enlace e2 origen → destino" aria-pressed="false"/);
  });

  it("ui-scada: el nodo elegido como origen de un enlace queda marcado", () => {
    expect(h()).toMatch(/<g role="button"[^>]*aria-label="Central Oriente[^>]*data-origen="true"/);
  });

  it("ui-scada: fuera del modo edición los enlaces no son botones", () => {
    expect(renderToStaticMarkup(createElement(Mimico, { datos: conNombres }))).not.toContain('aria-label="Enlace');
  });
});
