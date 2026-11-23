"use client";

import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { Icono } from "@/modulos/ui/Icono";
import { IconoEstado } from "@/modulos/ui/IconoEstado";
import { ESTADOS } from "@/modulos/ui/estado";
import { desplazar, encuadre, zoomEn, type Caja, type DatosMimico, type EnlaceMimico, type NodoMimico, type Punto } from "../mimico";
import { SimboloNodo, TIPO } from "./SimboloNodo";

const MARGEN = 90;
const PASO_ZOOM = 1.25;

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

const Enlace = memo(function Enlace({ e }: { e: EnlaceMimico }) {
  const grosor = e.flujo?.grosor ?? 2;
  return (
    <g>
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
    </g>
  );
});

type PropsNodo = {
  n: NodoMimico;
  onAbrir: (id: string) => void;
  onMostrar: (id: string, en?: Punto) => void;
  onOcultar: () => void;
};

const Nodo = memo(function Nodo({ n, onAbrir, onMostrar, onOcultar }: PropsNodo) {
  const teclado = (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      onAbrir(n.id);
    }
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={etiquetaNodo(n)}
      data-estado={n.nivel}
      data-tipo={n.tipo}
      className="mimico-nodo"
      transform={`translate(${n.x} ${n.y})`}
      onClick={() => onAbrir(n.id)}
      onKeyDown={teclado}
      onPointerDown={(ev) => ev.stopPropagation()}
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
        {n.nombre}
      </text>
      <text className="mimico-valor" y="57" textAnchor="middle">
        {n.sinUbicar ? "sin ubicar" : n.conexion === "desconectado" ? "desconectado" : formatoPotencia(n.potencia)}
      </text>
    </g>
  );
});

type Tooltip = { id: string; x: number; y: number };

/** Mímico de la red en SVG propio: enlaces con flujo, nodos por tipo y estado, zoom, arrastre, encuadre y tooltip. */
export function Mimico({ datos, onAbrir }: { datos: DatosMimico; onAbrir?: (id: string) => void }) {
  const router = useRouter();
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<SVGSVGElement>(null);
  const encuadreInicial = useMemo(() => encuadre(datos.nodos, MARGEN), [datos.nodos]);
  const [vista, setVista] = useState<Caja>(encuadreInicial);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const arrastre = useRef<{ x: number; y: number; vista: Caja; escala: number } | null>(null);

  const abrir = useCallback((id: string) => (onAbrir ? onAbrir(id) : router.push(`/nodos/${id}`)), [onAbrir, router]);

  // Coordenadas de pantalla → lienzo con la matriz real del SVG (respeta preserveAspectRatio).
  const aLienzo = useCallback((cliente: Punto): Punto | null => {
    const ctm = lienzo.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(cliente.x, cliente.y).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const mostrar = useCallback(
    (id: string, en?: Punto) => {
      const caja = contenedor.current?.getBoundingClientRect();
      if (!caja) return;
      let p = en;
      if (!p) {
        // Con teclado no hay puntero: el tooltip va junto al nodo.
        const n = datos.nodos.find((x) => x.id === id);
        const ctm = lienzo.current?.getScreenCTM();
        if (!n || !ctm) return;
        const s = new DOMPoint(n.x, n.y).matrixTransform(ctm);
        p = { x: s.x + 28, y: s.y };
      }
      // El tooltip mide 224 px: se recorta contra el borde derecho del mímico.
      setTooltip({ id, x: Math.max(8, Math.min(p.x - caja.left + 14, caja.width - 236)), y: p.y - caja.top + 14 });
    },
    [datos.nodos],
  );
  const ocultar = useCallback(() => setTooltip(null), []);

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
    ev.currentTarget.setPointerCapture(ev.pointerId);
    arrastre.current = { x: ev.clientX, y: ev.clientY, vista, escala: ctm.a };
  }
  function arrastrar(ev: PointerEvent<SVGSVGElement>) {
    const a = arrastre.current;
    if (a) setVista(desplazar(a.vista, (ev.clientX - a.x) / a.escala, (ev.clientY - a.y) / a.escala));
  }
  const soltar = () => (arrastre.current = null);

  const zoomCentro = (factor: number) => setVista((v) => zoomEn(v, factor, { x: v.x + v.ancho / 2, y: v.y + v.alto / 2 }));

  const capaEnlaces = useMemo(() => datos.enlaces.map((e) => <Enlace key={e.id} e={e} />), [datos.enlaces]);
  const capaNodos = useMemo(
    () => datos.nodos.map((n) => <Nodo key={n.id} n={n} onAbrir={abrir} onMostrar={mostrar} onOcultar={ocultar} />),
    [datos.nodos, abrir, mostrar, ocultar],
  );
  const nodoTooltip = tooltip && datos.nodos.find((n) => n.id === tooltip.id);
  const descripcion = "mimico-resumen";

  return (
    <div ref={contenedor} className="relative h-full min-h-80 overflow-hidden rounded-sc-lg border border-borde bg-fondo-2">
      <p id={descripcion} className="sr-only">
        {resumen(datos)}
      </p>
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
          <span aria-hidden="true" className="text-lg leading-none">+</span>
        </button>
        <button type="button" className="boton-fantasma" aria-label="Alejar" title="Alejar" onClick={() => zoomCentro(PASO_ZOOM)}>
          <span aria-hidden="true" className="text-lg leading-none">−</span>
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
