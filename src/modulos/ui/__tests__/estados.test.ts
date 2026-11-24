import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Cargando } from "../Cargando";
import { EstadoError } from "../EstadoError";
import { EstadoVacio } from "../EstadoVacio";

describe("estados de carga, error y vacío", () => {
  it("ui-scada: cargando anuncia la espera y muestra un esqueleto", () => {
    const h = renderToStaticMarkup(createElement(Cargando, {}));
    expect(h).toContain('role="status"');
    expect(h).toContain('aria-busy="true"');
    expect(h).toContain("Cargando…");
    expect(h).toContain("esqueleto");
  });

  it("ui-scada: el error es una alerta con su detalle y un botón para reintentar", () => {
    const h = renderToStaticMarkup(createElement(EstadoError, { detalle: "Sin respuesta de la base de datos", onReintentar: () => {} }));
    expect(h).toContain('role="alert"');
    expect(h).toContain("No se pudo cargar esta pantalla");
    expect(h).toContain("Sin respuesta de la base de datos");
    expect(h).toContain(">Reintentar</button>");
  });

  it("ui-scada: sin onReintentar el error no ofrece reintentar", () => {
    expect(renderToStaticMarkup(createElement(EstadoError, {}))).not.toContain("Reintentar");
  });

  it("ui-scada: el estado vacío tiene título, explicación y una acción opcional", () => {
    const h = renderToStaticMarkup(createElement(EstadoVacio, { titulo: "Aún no hay nodos", accion: createElement("a", { href: "/nodos" }, "Crear nodo") }, "Agrega el primero."));
    expect(h).toMatch(/<h2[^>]*>Aún no hay nodos<\/h2>/);
    expect(h).toContain("Agrega el primero.");
    expect(h).toContain('href="/nodos"');
  });
});
