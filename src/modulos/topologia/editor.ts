import type { EnlaceCrear, Posicion } from "./schema";
import type { Topologia } from "./service";
import { LIENZO_MAX, type TipoNodo } from "./tipos";

/** Estado del editor de la topología (solo administradores): funciones puras, sin red ni DOM. */

export const RETICULA = 10;

export type EstadoEditor = {
  /** Posición y tipo aún sin guardar, por nodo. */
  pendientes: Record<string, Posicion>;
  /** Primer nodo elegido para crear un enlace. */
  origen: string | null;
  /** Enlace que el usuario acaba de pedir (origen → destino); quien lo crea lo limpia. */
  enlacePropuesto: EnlaceCrear | null;
  enlaceSeleccionado: string | null;
};

export const EDITOR_INICIAL: EstadoEditor = { pendientes: {}, origen: null, enlacePropuesto: null, enlaceSeleccionado: null };

type Punto = { x: number; y: number };
export type AccionEditor =
  | { tipo: "mover"; id: string; x: number; y: number }
  | { tipo: "desplazar"; id: string; dx: number; dy: number; desde?: Punto }
  | { tipo: "cambiarTipo"; id: string; tipoNodo: TipoNodo; posicionActual: Punto }
  | { tipo: "elegirNodo"; id: string }
  | { tipo: "elegirEnlace"; id: string }
  | { tipo: "enlaceAtendido" }
  | { tipo: "descartar" };

const ajustar = (v: number) => Math.min(LIENZO_MAX, Math.max(0, Math.round(v / RETICULA) * RETICULA));

/** Posición vigente de un nodo: la pendiente, la guardada o, si no tiene, la que se indica. */
function posicion(t: Topologia, e: EstadoEditor, id: string, respaldo?: Punto): Posicion | null {
  if (e.pendientes[id]) return e.pendientes[id];
  const n = t.nodos.find((x) => x.id === id);
  if (n && n.x !== null && n.y !== null) return { tipo: n.tipo ?? "carga", x: n.x, y: n.y };
  return respaldo ? { tipo: n?.tipo ?? "carga", ...respaldo } : null;
}

const conPendiente = (e: EstadoEditor, id: string, p: Posicion): EstadoEditor => ({
  ...e,
  pendientes: { ...e.pendientes, [id]: { tipo: p.tipo, x: ajustar(p.x), y: ajustar(p.y) } },
});

export function editar(e: EstadoEditor, a: AccionEditor, t: Topologia): EstadoEditor {
  switch (a.tipo) {
    case "mover": {
      const actual = posicion(t, e, a.id, { x: a.x, y: a.y });
      return conPendiente(e, a.id, { tipo: actual!.tipo, x: a.x, y: a.y });
    }
    case "desplazar": {
      const actual = posicion(t, e, a.id, a.desde);
      return actual ? conPendiente(e, a.id, { ...actual, x: actual.x + a.dx, y: actual.y + a.dy }) : e;
    }
    case "cambiarTipo": {
      const actual = posicion(t, e, a.id, a.posicionActual)!;
      return conPendiente(e, a.id, { ...actual, tipo: a.tipoNodo });
    }
    case "elegirNodo":
      if (!e.origen) return { ...e, origen: a.id, enlaceSeleccionado: null };
      if (e.origen === a.id) return { ...e, origen: null };
      return { ...e, origen: null, enlacePropuesto: { origenId: e.origen, destinoId: a.id } };
    case "elegirEnlace":
      return { ...e, origen: null, enlaceSeleccionado: e.enlaceSeleccionado === a.id ? null : a.id };
    case "enlaceAtendido":
      return { ...e, enlacePropuesto: null };
    case "descartar":
      return EDITOR_INICIAL;
  }
}

/** La topología con las posiciones pendientes, para dibujarla mientras se edita. */
export function aplicarPendientes(t: Topologia, e: EstadoEditor): Topologia {
  if (Object.keys(e.pendientes).length === 0) return t;
  return { ...t, nodos: t.nodos.map((n) => (e.pendientes[n.id] ? { ...n, ...e.pendientes[n.id] } : n)) };
}

/** Posiciones que difieren de las guardadas: lo que hay que enviar con PUT /api/topologia/nodos/{id}. */
export function cambiosPorGuardar(t: Topologia, e: EstadoEditor): { id: string; posicion: Posicion }[] {
  return Object.entries(e.pendientes)
    .filter(([id, p]) => {
      const n = t.nodos.find((x) => x.id === id);
      return !n || n.tipo !== p.tipo || n.x !== p.x || n.y !== p.y;
    })
    .map(([id, posicion]) => ({ id, posicion }));
}
