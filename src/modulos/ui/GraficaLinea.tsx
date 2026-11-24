import { trazoSparkline } from "./trazo-sparkline";

const N = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const EJE = 44; // ancho reservado a la izquierda para las cifras del eje

type Props = { valores: readonly number[]; etiqueta: string; ancho?: number; alto?: number };

/** Gráfica de una serie en SVG propio (sin Recharts ni JS en el cliente): trazo, eje y mínimo y máximo. */
export function GraficaLinea({ valores, etiqueta, ancho = 220, alto = 100 }: Props) {
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const d = trazoSparkline(valores, ancho - EJE - 4, alto - 12);
  const descripcion = valores.length ? `${etiqueta}: de ${N.format(min)} a ${N.format(max)}, última ${N.format(valores.at(-1)!)}` : `${etiqueta}: sin datos`;
  return (
    <svg role="img" aria-label={descripcion} viewBox={`0 0 ${ancho} ${alto}`} width="100%" height={alto} className="text-acento">
      <line x1={EJE} y1="2" x2={EJE} y2={alto - 6} stroke="var(--sc-borde-fuerte)" />
      {valores.length > 0 && (
        <g className="cifra" fill="var(--sc-texto-tenue)" fontSize="10" textAnchor="end">
          <text x={EJE - 4} y="10">
            {N.format(max)}
          </text>
          <text x={EJE - 4} y={alto - 6}>
            {N.format(min)}
          </text>
        </g>
      )}
      {d && (
        <path
          d={d}
          transform={`translate(${EJE + 2} 6)`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
