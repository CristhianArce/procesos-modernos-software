import { MAGNITUDES } from "@/modulos/alertas/schema";
import type { Lectura } from "@/modulos/lecturas/repo";
import { conUnidad, formatearFecha } from "../formato";
import { GraficaSensor } from "./GraficaSensor";

/** Última lectura y gráfica de un sensor; `lecturas` va de la más antigua a la más reciente (CA-1, CA-2). */
export function TarjetaSensor({ nombre, lecturas }: { nombre: string; lecturas: Lectura[] }) {
  const ultima = lecturas.at(-1);
  return (
    <article className="rounded border border-borde p-4">
      <h3 className="font-semibold">{nombre}</h3>
      {ultima ? (
        <>
          <p data-testid="ultima-lectura" className="mt-1 text-sm">
            {`${MAGNITUDES.map((m) => conUnidad(ultima[m], m)).join(" · ")} · ${formatearFecha(ultima.tomadaEn)}`}
          </p>
          <GraficaSensor lecturas={lecturas} />
        </>
      ) : (
        <p className="mt-1 text-sm text-tenue">Sin lecturas</p>
      )}
    </article>
  );
}
