"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { Icono } from "@/modulos/ui/Icono";
import { IconoEstado } from "@/modulos/ui/IconoEstado";
import { ESTADOS } from "@/modulos/ui/estado";
import { desplazar, encuadre, nombreCorto, zoomEn, type Caja, type DatosMimico, type EnlaceMimico, type NodoMimico, type Punto } from "../mimico";
import { RETICULA } from "../editor";
import { SimboloNodo, TIPO } from "./SimboloNodo";

const MARGEN = 90;
const PASO_ZOOM = 1.25;
/** Desplazamiento mínimo (px de pantalla) para que soltar un nodo cuente como arrastre y no como clic. */
const UMBRAL_ARRASTRE = 4;
const AYUDA_EDICION = "mimico-ayuda-edicion";

/** Modo edición (solo administradores): si se pasa, los nodos se arrastran y se eligen, y los enlaces se seleccionan. */
export type Edicion = {
  origen: string | null;
  enlaceSeleccionado: string | null;
  onMoverNodo: (id: string, punto: Punto) => void;
  onDesplazarNodo: (id: string, dx: number, dy: number, desde: Punto) => void;
  onElegirNodo: (id: string) => void;
  onElegirEnlace: (id: string) => void;
};

const etiquetaNodo = (n: NodoMimico) =>
  [n.nombre, TIPO[n.tipo], ESTADOS[n.nivel].etiqueta, n.potencia !== null && formatoPotencia(n.potencia), n.alertasActivas > 0 && `${n.alertasActivas} ${n.alertasActivas === 1 ? "alerta activa" : "alertas activas"}`]
    .filter(Boolean)
    .join(", ");

function resumen({ nodos }: DatosMimico) {
  const desconectados = nodos.filter((n) => n.conexion === "desconectado").length;
  const criticos = nodos.filter((n) => n.nivel === "critico").length;
  const advertencias = nodos.filter((n) => n.nivel === "advertencia").length;
  const partes = [`${nodos.length} nodos: ${nodos.length - desconectados} conectados, ${desconectados} desconectado${desconectados === 1 ? "" : "s"}`];
  if (criticos) partes.push(`${criticos} en estado crítico`);
  if (advertencias) partes.push(`${advertencias} en advertencia`);
  return partes.join("; ");
}

// Comparación por valor: cada sondeo arma objetos nuevos, pero solo se repinta lo que cambió.
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Sigue el puntero aunque salga del SVG; si el navegador no puede capturarlo, el arrastre funciona igual dentro. */
function capturar(el: Element | null, puntero: number) {
  try {
    el?.setPointerCapture(puntero);
  } catch {
    // Puntero ya liberado o inexistente: no hay nada que capturar.
  }
}

const activar = (ev: KeyboardEvent, accion: () => void) => {
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    accion();
  }
};

type PropsEnlace = { e: EnlaceMimico; editando: boolean; seleccionado: boolean; onElegir?: (id: string) => void };

const Enlace = memo(
  function Enlace({ e, editando, seleccionado, onElegir }: PropsEnlace) {
    const grosor = e.flujo?.grosor ?? 2;
    return (
      <g data-seleccionado={seleccionado || undefined} className="mimico-grupo-enlace">
        <line className="mimico-enlace" data-activo={e.activo} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} strokeWidth={grosor} />
        {e.flujo && (
          <line
            className="mimico-flujo"
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            strokeWidth={Math.round(grosor * 6) / 10}
            style={{ "--duracion": `${e.flujo.duracionS}s` } as React.CSSProperties}
          />
        )}
        {editando && onElegir && (
          // Línea ancha e invisible para poder elegir el enlace con el ratón o con el teclado.
          <line
            role="button"
            tabIndex={0}
            aria-label={`Enlace ${e.etiqueta}`}
            aria-pressed={seleccionado}
            className="mimico-enlace-golpe"
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            strokeWidth="16"
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={() => onElegir(e.id)}
            onKeyDown={(ev) => activar(ev, () => onElegir(e.id))}
          />
        )}
      </g>
    );
  },
  (a, b) => a.editando === b.editando && a.seleccionado === b.seleccionado && a.onElegir === b.onElegir && igual(a.e, b.e),
);

type PropsNodo = {
  n: NodoMimico;
  seleccionado: boolean;
  origen: boolean;
  edicion: Edicion | undefined;
  onAbrir: (id: string) => void;
  onMostrar: (id: string, en?: Punto) => void;
  onOcultar: () => void;
  onAgarrar: (id: string, ev: PointerEvent<SVGGElement>) => void;
};

const FLECHAS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

const Nodo = memo(
  function Nodo({ n, seleccionado, origen, edicion, onAbrir, onMostrar, onOcultar, onAgarrar }: PropsNodo) {
    const teclado = (ev: KeyboardEvent) => {
      const flecha = FLECHAS[ev.key];
      if (edicion && flecha) {
        ev.preventDefault();
        const paso = ev.shiftKey ? RETICULA * 5 : RETICULA;
        return edicion.onDesplazarNodo(n.id, flecha[0] * paso, flecha[1] * paso, { x: n.x, y: n.y });
      }
      activar(ev, () => (edicion ? edicion.onElegirNodo(n.id) : onAbrir(n.id)));
    };
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={etiquetaNodo(n)}
        aria-expanded={edicion ? undefined : seleccionado}
        aria-describedby={edicion ? AYUDA_EDICION : undefined}
        data-nodo-id={n.id}
        data-parpadeo={n.parpadeo || undefined}
        data-seleccionado={seleccionado || undefined}
        data-origen={origen || undefined}
        data-editando={edicion ? true : undefined}
        data-estado={n.nivel}
        data-tipo={n.tipo}
        className="mimico-nodo"
        transform={`translate(${n.x} ${n.y})`}
        onClick={edicion ? undefined : () => onAbrir(n.id)}
        onKeyDown={teclado}
        onPointerDown={(ev) => (edicion ? onAgarrar(n.id, ev) : ev.stopPropagation())}
        onPointerEnter={(ev) => onMostrar(n.id, { x: ev.clientX, y: ev.clientY })}
        onPointerMove={(ev) => onMostrar(n.id, { x: ev.clientX, y: ev.clientY })}
        onPointerLeave={onOcultar}
        onFocus={() => onMostrar(n.id)}
        onBlur={onOcultar}
      >
        <circle className="anillo-foco" r="34" />
        <SimboloNodo tipo={n.tipo} />
        <g transform="translate(16 -34)" className="text-[var(--sc-estado)]">
          <circle cx="9" cy="9" r="10" fill="var(--sc-fondo)" />
          <g transform="translate(2 2)">
            <IconoEstado estado={n.nivel} tamano={14} />
          </g>
        </g>
        <text className="mimico-nombre" y="42" textAnchor="middle">
          {nombreCorto(n.nombre)}
        </text>
        <text className="mimico-valor" y="57" textAnchor="middle">
          {n.sinUbicar ? "sin ubicar" : n.conexion === "desconectado" ? "desconectado" : formatoPotencia(n.potencia)}
        </text>
      </g>
    );
  },
  (a, b) =>
    a.seleccionado === b.seleccionado &&
    a.origen === b.origen &&
    a.edicion === b.edicion &&
    a.onAbrir === b.onAbrir &&
    a.onMostrar === b.onMostrar &&
    a.onOcultar === b.onOcultar &&
    a.onAgarrar === b.onAgarrar &&
    igual(a.n, b.n),
);

type Tooltip = { id: string; x: number; y: number };
type Props = { datos: DatosMimico; onAbrir?: (id: string) => void; seleccionado?: string | null; edicion?: Edicion };
type ArrastreNodo = { id: string; cliente: Punto; desfase: Punto; movido: boolean };

/** Mímico de la red en SVG propio: enlaces con flujo, nodos por tipo y estado, zoom, arrastre, encuadre, tooltip y edición. */
export function Mimico({ datos, onAbrir, seleccionado = null, edicion }: Props) {
  const router = useRouter();
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<SVGSVGElement>(null);
  const encuadreInicial = useMemo(() => encuadre(datos.nodos, MARGEN), [datos.nodos]);
  const [vista, setVista] = useState<Caja>(encuadreInicial);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const arrastre = useRef<{ x: number; y: number; vista: Caja; escala: number } | null>(null);
  const arrastreNodo = useRef<ArrastreNodo | null>(null);
  // Los manejadores leen los datos y la edición de refs: así no cambian en cada sondeo y los nodos no se repintan.
  const ultimos = useRef({ datos, edicion });
  useEffect(() => {
    ultimos.current = { datos, edicion };
  }, [datos, edicion]);

  const abrir = useCallback((id: string) => (onAbrir ? onAbrir(id) : router.push(`/nodos/${id}`)), [onAbrir, router]);

  // Coordenadas de pantalla → lienzo con la matriz real del SVG (respeta preserveAspectRatio).
  const aLienzo = useCallback((cliente: Punto): Punto | null => {
    const ctm = lienzo.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(cliente.x, cliente.y).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const mostrar = useCallback((id: string, en?: Punto) => {
    const caja = contenedor.current?.getBoundingClientRect();
    if (!caja || arrastreNodo.current) return;
    let p = en;
    if (!p) {
      // Con teclado no hay puntero: el tooltip va junto al nodo.
      const n = ultimos.current.datos.nodos.find((x) => x.id === id);
      const ctm = lienzo.current?.getScreenCTM();
      if (!n || !ctm) return;
      const s = new DOMPoint(n.x, n.y).matrixTransform(ctm);
      p = { x: s.x + 28, y: s.y };
    }
    // El tooltip mide 224 px: se recorta contra el borde derecho del mímico.
    setTooltip({ id, x: Math.max(8, Math.min(p.x - caja.left + 14, caja.width - 236)), y: p.y - caja.top + 14 });
  }, []);
  const ocultar = useCallback(() => setTooltip(null), []);

  const agarrar = useCallback(
    (id: string, ev: PointerEvent<SVGGElement>) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      const n = ultimos.current.datos.nodos.find((x) => x.id === id);
      const p = aLienzo({ x: ev.clientX, y: ev.clientY });
      if (!n || !p) return;
      arrastreNodo.current = { id, cliente: { x: ev.clientX, y: ev.clientY }, desfase: { x: n.x - p.x, y: n.y - p.y }, movido: false };
      capturar(lienzo.current, ev.pointerId);
      setTooltip(null);
    },
    [aLienzo],
  );

  // La rueda necesita un oyente no pasivo para evitar que la página se desplace.
  useEffect(() => {
    const svg = lienzo.current;
    if (!svg) return;
    const rueda = (ev: WheelEvent) => {
      ev.preventDefault();
      const p = aLienzo({ x: ev.clientX, y: ev.clientY });
      if (p) setVista((v) => zoomEn(v, Math.exp(ev.deltaY * 0.0015), p));
    };
    svg.addEventListener("wheel", rueda, { passive: false });
    return () => svg.removeEventListener("wheel", rueda);
  }, [aLienzo]);

  function empezarArrastre(ev: PointerEvent<SVGSVGElement>) {
    const ctm = lienzo.current?.getScreenCTM();
    if (!ctm || ev.button !== 0) return;
    arrastre.current = { x: ev.clientX, y: ev.clientY, vista, escala: ctm.a };
    capturar(ev.currentTarget, ev.pointerId);
  }
  function arrastrar(ev: PointerEvent<SVGSVGElement>) {
    const nodo = arrastreNodo.current;
    if (nodo) {
      const lejos = Math.hypot(ev.clientX - nodo.cliente.x, ev.clientY - nodo.cliente.y) >= UMBRAL_ARRASTRE;
      const p = aLienzo({ x: ev.clientX, y: ev.clientY });
      if ((nodo.movido || lejos) && p) {
        nodo.movido = true;
        ultimos.current.edicion?.onMoverNodo(nodo.id, { x: p.x + nodo.desfase.x, y: p.y + nodo.desfase.y });
      }
      return;
    }
    const a = arrastre.current;
    if (a) setVista(desplazar(a.vista, (ev.clientX - a.x) / a.escala, (ev.clientY - a.y) / a.escala));
  }
  function soltar() {
    const nodo = arrastreNodo.current;
    if (nodo && !nodo.movido) ultimos.current.edicion?.onElegirNodo(nodo.id); // un clic sin mover elige el nodo
    arrastreNodo.current = null;
    arrastre.current = null;
  }

  const zoomCentro = (factor: number) => setVista((v) => zoomEn(v, factor, { x: v.x + v.ancho / 2, y: v.y + v.alto / 2 }));

  const editando = Boolean(edicion);
  const elegirEnlace = edicion?.onElegirEnlace;
  const enlaceSel = edicion?.enlaceSeleccionado ?? null;
  const origen = edicion?.origen ?? null;
  const capaEnlaces = useMemo(
    () => datos.enlaces.map((e) => <Enlace key={e.id} e={e} editando={editando} seleccionado={e.id === enlaceSel} onElegir={elegirEnlace} />),
    [datos.enlaces, editando, enlaceSel, elegirEnlace],
  );
  const capaNodos = useMemo(
    () =>
      datos.nodos.map((n) => (
        <Nodo
          key={n.id}
          n={n}
          seleccionado={n.id === seleccionado}
          origen={n.id === origen}
          edicion={edicion}
          onAbrir={abrir}
          onMostrar={mostrar}
          onOcultar={ocultar}
          onAgarrar={agarrar}
        />
      )),
    [datos.nodos, seleccionado, origen, edicion, abrir, mostrar, ocultar, agarrar],
  );
  const nodoTooltip = tooltip && datos.nodos.find((n) => n.id === tooltip.id);
  const descripcion = "mimico-resumen";

  return (
    <div
      ref={contenedor}
      data-editando={editando || undefined}
      className="relative h-full min-h-80 overflow-hidden rounded-sc-lg border border-borde bg-fondo-2 data-[editando]:border-advertencia/70"
    >
      <p id={descripcion} className="sr-only">
        {resumen(datos)}
      </p>
      {edicion && (
        <p id={AYUDA_EDICION} className="pointer-events-none absolute top-3 left-3 z-10 max-w-md rounded-sc border border-advertencia/50 bg-panel/90 px-3 py-2 text-xs text-tenue">
          <strong className="text-advertencia">Modo edición.</strong> Arrastra un nodo o muévelo con las flechas (Mayús: pasos de 50). Elige dos nodos para enlazarlos (del primero al segundo) o un enlace para borrarlo.
        </p>
      )}
      <svg
        ref={lienzo}
        role="group"
        aria-label="Mímico de la red eléctrica"
        aria-describedby={descripcion}
        viewBox={`${vista.x} ${vista.y} ${vista.ancho} ${vista.alto}`}
        preserveAspectRatio="xMidYMid meet"
        className="mimico block size-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={empezarArrastre}
        onPointerMove={arrastrar}
        onPointerUp={soltar}
        onPointerCancel={soltar}
      >
        <defs>
          <pattern id="mimico-reticula" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" className="mimico-reticula" />
          </pattern>
        </defs>
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#mimico-reticula)" />
        {capaEnlaces}
        {capaNodos}
      </svg>

      <div className="absolute top-3 right-3 flex flex-col gap-1 rounded-sc border border-borde bg-panel/90 p-1 shadow-sc">
        <button type="button" className="boton-fantasma" aria-label="Acercar" title="Acercar" onClick={() => zoomCentro(1 / PASO_ZOOM)}>
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
        </button>
        <button type="button" className="boton-fantasma" aria-label="Alejar" title="Alejar" onClick={() => zoomCentro(PASO_ZOOM)}>
          <span aria-hidden="true" className="text-lg leading-none">
            −
          </span>
        </button>
        <button type="button" className="boton-fantasma" aria-label="Encuadrar toda la red" title="Encuadrar toda la red" onClick={() => setVista(encuadreInicial)}>
          <Icono nombre="encuadrar" tamano={18} />
        </button>
      </div>

      {nodoTooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-56 rounded-sc border border-borde-fuerte bg-panel/95 p-3 text-sm shadow-sc"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold text-texto">{nodoTooltip.nombre}</p>
          <p className="text-xs text-tenue capitalize">{TIPO[nodoTooltip.tipo]}</p>
          <p data-estado={nodoTooltip.nivel} className="mt-1.5 flex items-center gap-1.5 text-[var(--sc-estado)]">
            <IconoEstado estado={nodoTooltip.nivel} tamano={12} />
            <span className="text-texto">{ESTADOS[nodoTooltip.nivel].etiqueta}</span>
          </p>
          <dl className="cifra mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            <dt className="text-tenue">Tensión</dt>
            <dd className="text-right">{formatoTension(nodoTooltip.voltaje)}</dd>
            <dt className="text-tenue">Corriente</dt>
            <dd className="text-right">{formatoCorriente(nodoTooltip.corriente)}</dd>
            <dt className="text-tenue">Potencia</dt>
            <dd className="text-right">{formatoPotencia(nodoTooltip.potencia)}</dd>
            <dt className="text-tenue">Alertas (15 min)</dt>
            <dd className="text-right">{nodoTooltip.alertasActivas}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
