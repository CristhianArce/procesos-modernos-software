"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import type { EstadoNodo } from "@/modulos/estado/calculo";
import { formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { Icono } from "@/modulos/ui/Icono";
import { IndicadorEstado } from "@/modulos/ui/IndicadorEstado";
import { Insignia } from "@/modulos/ui/Insignia";
import { filtrarNodos } from "../filtro";

/** Lista de nodos con su conexión, su estado frente a los umbrales y una búsqueda local. */
export function TablaNodos({ nodos }: { nodos: EstadoNodo[] }) {
  const [texto, setTexto] = useState("");
  const visibles = filtrarNodos(nodos, useDeferredValue(texto));

  return (
    <div>
      <label className="relative block max-w-sm">
        <span className="sr-only">Buscar nodo por nombre o ubicación</span>
        <Icono nombre="buscar" tamano={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-apagado" />
        <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o ubicación" className="campo pl-9" />
      </label>
      <p className="mt-2 text-xs text-apagado" aria-live="polite">
        {visibles.length === nodos.length ? `${nodos.length} nodos` : `${visibles.length} de ${nodos.length} nodos`}
      </p>
      {visibles.length === 0 ? (
        <p className="mt-4 text-tenue">{`Ningún nodo coincide con «${texto.trim()}».`}</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Conexión</th>
                <th>Estado</th>
                <th className="text-right">Tensión</th>
                <th className="text-right">Potencia</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((n) => (
                <tr key={n.id}>
                  <td>
                    <Link href={`/nodos/${n.id}`} className="enlace font-medium">
                      {n.nombre}
                    </Link>
                  </td>
                  <td className="text-tenue">{n.ubicacion ?? "—"}</td>
                  <td>
                    <IndicadorEstado
                      estado={n.conexion === "conectado" ? "normal" : "desconectado"}
                      etiqueta={n.conexion === "conectado" ? "Conectado" : "Desconectado"}
                    />
                  </td>
                  <td>
                    <IndicadorEstado estado={n.nivel} />
                  </td>
                  <td className="cifra text-right">{formatoTension(n.voltaje)}</td>
                  <td className="cifra text-right">{formatoPotencia(n.potencia)}</td>
                  <td>{n.alertasActivas > 0 ? <Insignia tono="critico">{n.alertasActivas}</Insignia> : <span className="text-apagado">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
