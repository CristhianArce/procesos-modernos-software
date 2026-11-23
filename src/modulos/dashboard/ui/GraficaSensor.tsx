"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";
import type { Lectura } from "@/modulos/lecturas/repo";
import { TITULO } from "../formato";

/** Tres gráficas pequeñas, una por magnitud y cada una con su propio eje, sin interacción (CA-2, RN-5). */
export function GraficaSensor({ lecturas }: { lecturas: Lectura[] }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {Object.entries(TITULO).map(([magnitud, titulo]) => (
        <figure key={magnitud}>
          <figcaption className="text-xs text-tenue">{titulo}</figcaption>
          <LineChart width={220} height={100} data={lecturas}>
            <XAxis dataKey="tomadaEn" hide />
            <YAxis domain={["auto", "auto"]} width={44} tick={{ fontSize: 10 }} />
            <Line dataKey={magnitud} dot={false} isAnimationActive={false} stroke="var(--sc-acento)" />
          </LineChart>
        </figure>
      ))}
    </div>
  );
}
