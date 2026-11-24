import { formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import type { Tono } from "@/modulos/ui/Insignia";
import { Sparkline } from "@/modulos/ui/Sparkline";
import type { Indicadores } from "../calculo";

type Kpi = { titulo: string; valor: string; detalle?: string; serie: number[]; tono: Tono };

function TarjetaKpi({ titulo, valor, detalle, serie, tono }: Kpi) {
  return (
    <li data-tono={tono} className="relative overflow-hidden rounded-sc-lg border border-borde bg-panel px-4 pt-3 pb-2 shadow-sc">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--sc-estado)] opacity-80" />
      <p className="text-xs font-semibold tracking-wider text-tenue uppercase">{titulo}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="cifra text-2xl font-semibold text-texto">{valor}</span>
        {detalle && <span className="text-xs text-apagado">{detalle}</span>}
      </p>
      {serie.length >= 2 ? (
        <Sparkline valores={serie} etiqueta={`Tendencia de ${titulo.toLowerCase()} en los últimos 15 minutos`} ancho={160} alto={28} className="mt-1 w-full text-[var(--sc-estado)]" />
      ) : (
        // El modelo no guarda historia de la conexión de los nodos: no se inventa una tendencia.
        <p className="mt-1 flex h-7 items-center text-xs text-apagado">Sin historial</p>
      )}
    </li>
  );
}

/** Potencia, nodos, alertas y tensión de toda la red, con su tendencia de los últimos 15 minutos. */
export function FranjaIndicadores({ indicadores: k }: { indicadores: Indicadores }) {
  const kpis: Kpi[] = [
    { titulo: "Potencia total", valor: formatoPotencia(k.potenciaTotal), serie: k.tendencia.potencia, tono: "acento" },
    { titulo: "Nodos conectados", valor: String(k.nodosConectados), detalle: `de ${k.nodosTotales}`, serie: k.tendencia.nodos, tono: "normal" },
    {
      titulo: "Nodos desconectados",
      valor: String(k.nodosDesconectados),
      serie: [],
      tono: k.nodosDesconectados > 0 ? "desconectado" : "neutro",
    },
    { titulo: "Alertas activas", valor: String(k.alertasActivas), detalle: "15 min", serie: k.tendencia.alertas, tono: k.alertasActivas > 0 ? "critico" : "neutro" },
    { titulo: "Tensión media", valor: formatoTension(k.tensionMedia), serie: k.tendencia.tension, tono: "acento" },
  ];
  return (
    <ul aria-label="Indicadores de la red" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => (
        <TarjetaKpi key={kpi.titulo} {...kpi} />
      ))}
    </ul>
  );
}
