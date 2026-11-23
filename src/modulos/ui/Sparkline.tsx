import { trazoSparkline } from "./trazo-sparkline";

type Props = { valores: readonly number[]; etiqueta: string; ancho?: number; alto?: number; className?: string };

/** Minigráfica en SVG propio (sin Recharts): un trazo, sin ejes. Hereda el color con `currentColor`. */
export function Sparkline({ valores, etiqueta, ancho = 120, alto = 28, className = "text-acento" }: Props) {
  const d = trazoSparkline(valores, ancho, alto - 2);
  return (
    <svg role="img" aria-label={etiqueta} viewBox={`0 -1 ${ancho} ${alto}`} width={ancho} height={alto} className={className}>
      {d && <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
