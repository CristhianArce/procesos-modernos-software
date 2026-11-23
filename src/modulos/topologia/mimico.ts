import type { Conexion, EstadoNodo } from "@/modulos/estado/calculo";
import type { Estado } from "@/modulos/ui/estado";
import type { TipoNodo } from "./schema";
import type { Topologia } from "./service";

/** Geometría y datos del mímico: funciones puras, para probarlas sin navegador y usarlas en el cliente. */

export type Punto = { x: number; y: number };
export type Caja = { x: number; y: number; ancho: number; alto: number };
export type Flujo = { grosor: number; duracionS: number };

export type NodoMimico = Punto & {
  id: string;
  nombre: string;
  tipo: TipoNodo;
  sinUbicar: boolean;
  conexion: Conexion;
  nivel: Estado;
  voltaje: number | null;
  corriente: number | null;
  potencia: number | null;
  alertasActivas: number;
};

export type EnlaceMimico = { id: string; x1: number; y1: number; x2: number; y2: number; activo: boolean; flujo: Flujo | null };
export type DatosMimico = { nodos: NodoMimico[]; enlaces: EnlaceMimico[] };

/** Lienzo por defecto cuando no hay nodos (el de la semilla cabe en él). */
export const LIENZO: Caja = { x: 0, y: 0, ancho: 1200, alto: 700 };
const ANCHO_MIN = 200;
const ANCHO_MAX = 6000;
const SEPARACION_SIN_UBICAR = 180;

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Más potencia, línea más gruesa (2 a 6) y flujo más rápido (2,5 s a 0,6 s por ciclo). Sin potencia no hay flujo. */
export function estiloFlujo(potencia: number | null, maxima: number): Flujo | null {
  if (!potencia || potencia <= 0) return null;
  const f = Math.min(1, potencia / (maxima || potencia));
  return { grosor: r1(2 + 4 * f), duracionS: r2(2.5 - 1.9 * f) };
}

export function armarMimico(topologia: Topologia, estados: EstadoNodo[]): DatosMimico {
  const porId = new Map(estados.map((e) => [e.id, e]));
  const ubicados = topologia.nodos.filter((n) => n.x !== null && n.y !== null);
  const fondo = Math.max(LIENZO.alto, ...ubicados.map((n) => n.y!)) + 160;
  const izquierda = ubicados.length ? Math.min(...ubicados.map((n) => n.x!)) : LIENZO.x + 100;
  let siguiente = 0;

  const nodos: NodoMimico[] = topologia.nodos.map((n) => {
    const e = porId.get(n.id);
    const sinUbicar = n.x === null || n.y === null;
    const posicion = sinUbicar ? { x: izquierda + SEPARACION_SIN_UBICAR * siguiente++, y: fondo } : { x: n.x!, y: n.y! };
    return {
      id: n.id,
      nombre: n.nombre,
      tipo: n.tipo ?? "carga",
      sinUbicar,
      ...posicion,
      conexion: n.estado,
      nivel: e?.nivel ?? (n.estado === "desconectado" ? "desconectado" : "sin-datos"),
      voltaje: e?.voltaje ?? null,
      corriente: e?.corriente ?? null,
      potencia: e?.potencia ?? null,
      alertasActivas: e?.alertasActivas ?? 0,
    };
  });

  const nodoPorId = new Map(nodos.map((n) => [n.id, n]));
  const maxima = Math.max(0, ...nodos.map((n) => (n.conexion === "conectado" ? (n.potencia ?? 0) : 0)));
  const enlaces = topologia.enlaces.flatMap((e): EnlaceMimico[] => {
    const a = nodoPorId.get(e.origenId);
    const b = nodoPorId.get(e.destinoId);
    if (!a || !b) return [];
    const activo = a.conexion === "conectado" && b.conexion === "conectado";
    return [{ id: e.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, activo, flujo: activo ? estiloFlujo(b.potencia, maxima) : null }];
  });
  return { nodos, enlaces };
}

/** Caja que abarca todos los puntos con `margen` alrededor. */
export function encuadre(puntos: Punto[], margen: number): Caja {
  if (puntos.length === 0) return LIENZO;
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  const x = Math.min(...xs) - margen;
  const y = Math.min(...ys) - margen;
  return { x, y, ancho: Math.max(...xs) + margen - x, alto: Math.max(...ys) + margen - y };
}

/** Escala la vista por `factor` (< 1 acerca) dejando fijo `punto`, con el ancho entre 200 y 6000. */
export function zoomEn(vista: Caja, factor: number, punto: Punto): Caja {
  const ancho = Math.min(ANCHO_MAX, Math.max(ANCHO_MIN, vista.ancho * factor));
  const f = ancho / vista.ancho;
  return { x: punto.x - (punto.x - vista.x) * f, y: punto.y - (punto.y - vista.y) * f, ancho, alto: vista.alto * f };
}

/** Mover el fondo `dx`, `dy` (en unidades del lienzo) desplaza la vista en sentido contrario. */
export const desplazar = (vista: Caja, dx: number, dy: number): Caja => ({ ...vista, x: vista.x - dx, y: vista.y - dy });
