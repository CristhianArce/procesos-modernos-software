import type { Lectura } from "@/modulos/lecturas/repo";
import { GraficaLinea } from "@/modulos/ui/GraficaLinea";
import { TITULO } from "../formato";

/** Tres gráficas pequeñas, una por magnitud y cada una con su propio eje, sin interacción (CA-2, RN-5). SVG propio, sin Recharts. */
export function GraficaSensor({ lecturas }: { lecturas: Lectura[] }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {(Object.entries(TITULO) as [keyof typeof TITULO, string][]).map(([magnitud, titulo]) => (
        <figure key={magnitud}>
          <figcaption className="text-xs text-tenue">{titulo}</figcaption>
          <GraficaLinea valores={lecturas.map((l) => l[magnitud])} etiqueta={titulo} />
        </figure>
      ))}
    </div>
  );
}
