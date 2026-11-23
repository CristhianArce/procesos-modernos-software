"use client";

import { useCallback, useMemo, useState } from "react";
import { useEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import { FranjaIndicadores } from "@/modulos/estado/ui/FranjaIndicadores";
import { PanelAlarmas } from "@/modulos/estado/ui/PanelAlarmas";
import { armarMimico, type DatosMimico } from "@/modulos/topologia/mimico";
import type { Topologia } from "@/modulos/topologia/service";
import { LeyendaMimico } from "@/modulos/topologia/ui/LeyendaMimico";
import { Mimico } from "@/modulos/topologia/ui/Mimico";
import { PanelNodo } from "@/modulos/topologia/ui/PanelNodo";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

/** Datos del mímico con la última instantánea; los nodos con una alerta recién llegada parpadean. */
function useMimicoVivo(topologia: Topologia): DatosMimico {
  const { instantanea, nuevas } = useEstadoVivo();
  return useMemo(() => {
    const conAlertaNueva = new Set(nuevas.map((a) => a.nodoId));
    const datos = armarMimico(topologia, instantanea.nodos);
    return { ...datos, nodos: datos.nodos.map((n) => (conAlertaNueva.has(n.id) ? { ...n, parpadeo: true } : n)) };
  }, [topologia, instantanea.nodos, nuevas]);
}

/** Dashboard en vivo: indicadores, mímico con panel lateral del nodo y panel de alarmas. */
export function TableroVivo({ topologia }: { topologia: Topologia }) {
  const { instantanea } = useEstadoVivo();
  const datos = useMimicoVivo(topologia);
  const [abierto, setAbierto] = useState<string | null>(null);
  const nodoAbierto = abierto ? datos.nodos.find((n) => n.id === abierto) : undefined;

  const cerrar = useCallback(() => {
    const id = abierto;
    setAbierto(null);
    // Devuelve el foco al nodo del mímico que abrió el panel (sigue montado: se puede enfocar ya).
    if (id) document.querySelector<SVGGElement>(`[data-nodo-id="${id}"]`)?.focus();
  }, [abierto]);

  return (
    <>
      <FranjaIndicadores indicadores={instantanea.indicadores} />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_30rem]">
        <Tarjeta titulo="Mímico de la red">
          <div className="relative h-[clamp(22rem,50vw,640px)]">
            <Mimico datos={datos} onAbrir={setAbierto} seleccionado={abierto} />
            {nodoAbierto && <PanelNodo nodo={nodoAbierto} generadaEn={instantanea.generadaEn} onCerrar={cerrar} />}
          </div>
          <div className="mt-3">
            <LeyendaMimico />
          </div>
        </Tarjeta>
        <div id="alarmas" className="scroll-mt-4">
          <Tarjeta titulo="Alarmas" className="flex max-h-[32rem] flex-col 2xl:max-h-[calc(clamp(22rem,50vw,640px)+6rem)] [&>div]:flex [&>div]:min-h-0 [&>div]:flex-1 [&>div]:flex-col [&>div]:p-0">
            <PanelAlarmas />
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
