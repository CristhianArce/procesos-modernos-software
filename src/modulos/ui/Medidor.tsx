import { ESTADOS } from "./estado";
import { IconoEstado } from "./IconoEstado";
import { escalaMedidor } from "./escala-medidor";
import { cifraConUnidad } from "./formato";

type Props = { etiqueta: string; valor: number | null; umbral: number | null; unidad: string };

const pct = (f: number) => `${(f * 100).toFixed(1)}%`;

/** Barra horizontal con marca en el umbral (decisión #5 del plan). */
export function Medidor({ etiqueta, valor, umbral, unidad }: Props) {
  const { maximo, fraccion, fraccionUmbral, nivel } = escalaMedidor(valor, umbral);
  const texto = valor === null ? "Sin datos" : cifraConUnidad(valor, unidad);
  return (
    <div data-estado={nivel} className="text-[var(--sc-estado)]">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-tenue">{etiqueta}</span>
        <span className="flex items-center gap-1.5">
          <IconoEstado estado={nivel} tamano={12} />
          <span className="cifra text-base text-texto">{texto}</span>
          <span className="sr-only">{ESTADOS[nivel].etiqueta}</span>
        </span>
      </div>
      <div
        // Sin lectura no hay valor que anunciar: la barra queda decorativa y el texto dice "Sin datos".
        {...(valor === null
          ? { "aria-hidden": true }
          : {
              role: "meter",
              "aria-label": etiqueta,
              "aria-valuemin": 0,
              "aria-valuemax": maximo,
              "aria-valuenow": valor,
              "aria-valuetext": `${texto}${umbral === null ? "" : `, umbral ${cifraConUnidad(umbral, unidad)}`}`,
            })}
        className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-panel-2"
      >
        <div className="h-full rounded-full bg-current transition-[width] duration-500" style={{ width: pct(fraccion) }} />
        {fraccionUmbral !== null && (
          <div className="absolute inset-y-0 w-0.5 bg-texto/80" style={{ left: pct(fraccionUmbral) }} aria-hidden="true" />
        )}
      </div>
      {umbral !== null && <p className="cifra mt-1 text-right text-xs text-apagado">{`Umbral ${cifraConUnidad(umbral, unidad)}`}</p>}
    </div>
  );
}
