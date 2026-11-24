import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarraEditor } from "../ui/BarraEditor";

type Props = ComponentProps<typeof BarraEditor>;
const nada = () => {};
const base: Props = {
  editando: false,
  pendientes: 0,
  nodoElegido: null,
  enlaceElegido: null,
  ocupado: false,
  mensaje: null,
  onEditar: nada,
  onGuardar: nada,
  onDescartar: nada,
  onSalir: nada,
  onBorrarEnlace: nada,
  onCambiarTipo: nada,
};
const html = (p: Partial<Props> = {}) => renderToStaticMarkup(createElement(BarraEditor, { ...base, ...p }));

describe("barra del editor de topología", () => {
  it("ui-scada: fuera de edición solo ofrece entrar al modo edición", () => {
    const h = html();
    expect(h).toContain(">Editar topología</button>");
    expect(h).not.toContain("Guardar posiciones");
  });

  it("ui-scada: en edición ofrece guardar (con cuántos cambios), descartar y salir; sin cambios, guardar está deshabilitado", () => {
    expect(html({ editando: true })).toMatch(/<button[^>]*disabled=""[^>]*>Guardar posiciones/);
    const h = html({ editando: true, pendientes: 2 });
    expect(h).toContain("Guardar posiciones (2)");
    expect(h).not.toMatch(/<button[^>]*disabled=""[^>]*>Guardar posiciones/);
    expect(h).toContain(">Descartar cambios</button>");
    expect(h).toContain(">Salir de edición</button>");
  });

  it("ui-scada: con un nodo elegido dice que falta el destino y deja cambiar su tipo", () => {
    const h = html({ editando: true, nodoElegido: { nombre: "Subestación Norte", tipo: "subestacion" } });
    expect(h).toContain("Elige el nodo destino del enlace desde Subestación Norte");
    expect(h).toContain("Tipo de Subestación Norte");
    expect(h).toMatch(/<option value="subestacion" selected="">/);
  });

  it("ui-scada: con un enlace elegido ofrece borrarlo", () => {
    expect(html({ editando: true, enlaceElegido: "A → B" })).toContain(">Borrar enlace A → B</button>");
  });

  it("ui-scada: los mensajes se anuncian en una región viva", () => {
    expect(html({ editando: true, mensaje: { tipo: "error", texto: "Ya existe un enlace entre esos nodos" } })).toMatch(
      /role="status"[^>]*>[\s\S]*Ya existe un enlace entre esos nodos/,
    );
  });
});
