import { describe, expect, it } from "vitest";
import { aplicarPendientes, cambiosPorGuardar, editar, EDITOR_INICIAL, type EstadoEditor } from "../editor";
import type { Topologia } from "../service";

const topologia: Topologia = {
  nodos: [
    { id: "a", nombre: "A", estado: "conectado", tipo: "subestacion", x: 100, y: 100 },
    { id: "b", nombre: "B", estado: "conectado", tipo: "carga", x: 300, y: 100 },
    { id: "n", nombre: "Nuevo", estado: "conectado", tipo: null, x: null, y: null },
  ],
  enlaces: [{ id: "e1", origenId: "a", destinoId: "b" }],
};

describe("editor de la topología", () => {
  it("ui-scada: mover un nodo lo ajusta a la retícula de 10 y lo mantiene dentro del lienzo", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "mover", id: "a", x: 123.4, y: 96 }, topologia);
    expect(e.pendientes.a).toEqual({ tipo: "subestacion", x: 120, y: 100 });
    e = editar(e, { tipo: "mover", id: "a", x: -50, y: 2600 }, topologia);
    expect(e.pendientes.a).toMatchObject({ x: 0, y: 2000 });
  });

  it("ui-scada: con el teclado un nodo se mueve en pasos de 10 desde su posición actual o pendiente", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "desplazar", id: "b", dx: 10, dy: 0 }, topologia);
    e = editar(e, { tipo: "desplazar", id: "b", dx: 0, dy: -50 }, topologia);
    expect(e.pendientes.b).toEqual({ tipo: "carga", x: 310, y: 50 });
  });

  it("ui-scada: un nodo sin ubicar se ubica como carga al moverlo, y se le puede cambiar el tipo", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "mover", id: "n", x: 500, y: 500 }, topologia);
    expect(e.pendientes.n).toEqual({ tipo: "carga", x: 500, y: 500 });
    e = editar(e, { tipo: "cambiarTipo", id: "n", tipoNodo: "alimentador", posicionActual: { x: 500, y: 500 } }, topologia);
    expect(e.pendientes.n.tipo).toBe("alimentador");
  });

  it("ui-scada: elegir dos nodos distintos propone un enlace del primero al segundo y reinicia la elección", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "elegirNodo", id: "a" }, topologia);
    expect(e.origen).toBe("a");
    expect(e.enlacePropuesto).toBeNull();
    e = editar(e, { tipo: "elegirNodo", id: "n" }, topologia);
    expect(e.enlacePropuesto).toEqual({ origenId: "a", destinoId: "n" });
    expect(e.origen).toBeNull();
  });

  it("ui-scada: elegir dos veces el mismo nodo cancela la elección", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "elegirNodo", id: "a" }, topologia);
    e = editar(e, { tipo: "elegirNodo", id: "a" }, topologia);
    expect(e).toMatchObject({ origen: null, enlacePropuesto: null });
  });

  it("ui-scada: elegir un enlace lo selecciona y elegirlo otra vez lo deselecciona", () => {
    let e = editar(EDITOR_INICIAL, { tipo: "elegirEnlace", id: "e1" }, topologia);
    expect(e.enlaceSeleccionado).toBe("e1");
    e = editar(e, { tipo: "elegirEnlace", id: "e1" }, topologia);
    expect(e.enlaceSeleccionado).toBeNull();
  });

  it("ui-scada: descartar vuelve al estado inicial", () => {
    const e = editar(editar(EDITOR_INICIAL, { tipo: "mover", id: "a", x: 1, y: 1 }, topologia), { tipo: "descartar" }, topologia);
    expect(e).toEqual(EDITOR_INICIAL);
  });

  it("ui-scada: las posiciones pendientes se aplican sobre la topología para dibujarlas", () => {
    const e = editar(EDITOR_INICIAL, { tipo: "mover", id: "n", x: 700, y: 200 }, topologia);
    const t = aplicarPendientes(topologia, e);
    expect(t.nodos.find((n) => n.id === "n")).toMatchObject({ tipo: "carga", x: 700, y: 200 });
    expect(t.nodos.find((n) => n.id === "a")).toBe(topologia.nodos[0]);
    expect(t.enlaces).toBe(topologia.enlaces);
  });

  it("ui-scada: solo se guardan las posiciones que cambiaron de verdad", () => {
    let e: EstadoEditor = editar(EDITOR_INICIAL, { tipo: "mover", id: "a", x: 100, y: 100 }, topologia);
    e = editar(e, { tipo: "mover", id: "b", x: 400, y: 100 }, topologia);
    expect(cambiosPorGuardar(topologia, e)).toEqual([{ id: "b", posicion: { tipo: "carga", x: 400, y: 100 } }]);
  });
});
