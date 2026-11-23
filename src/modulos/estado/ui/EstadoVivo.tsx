"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AlertaReciente } from "../alarmas";
import { alertasNuevas, apilarAvisos, fusionarInstantanea } from "../fusion";
import type { InstantaneaViva } from "../vivo";

export type Conexion = "en-linea" | "sin-conexion" | "conectando";

/** Cada cuánto se consulta GET /api/estado (entre 2 y 3 s). */
export const INTERVALO_MS = 2500;
/** Cuánto dura un aviso de alerta nueva en pantalla (y el parpadeo de su nodo). */
export const DURACION_AVISO_MS = 8000;

type Valor = {
  instantanea: InstantaneaViva;
  conexion: Conexion;
  /** Alertas que llegaron en los últimos segundos (una por sensor y magnitud), de la más nueva a la más vieja. */
  nuevas: AlertaReciente[];
  cerrarAviso: (id: string) => void;
};

const Contexto = createContext<Valor | null>(null);

export function useEstadoVivo(): Valor {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useEstadoVivo necesita <ProveedorEstadoVivo>");
  return valor;
}

/**
 * Sondea la instantánea con un bucle de setTimeout (no setInterval: nunca hay dos consultas a la vez), se pausa
 * con la pestaña oculta, marca «sin conexión» si falla y conserva lo que no cambió para no repintarlo.
 */
export function ProveedorEstadoVivo({ inicial, children }: { inicial: InstantaneaViva; children: React.ReactNode }) {
  const [instantanea, setInstantanea] = useState(inicial);
  const [conexion, setConexion] = useState<Conexion>("en-linea");
  const [nuevas, setNuevas] = useState<AlertaReciente[]>([]);
  const vistas = useRef(new Set(inicial.alertas.map((a) => a.id)));
  const router = useRouter();

  const cerrarAviso = useCallback((id: string) => setNuevas((n) => n.filter((a) => a.id !== id)), []);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const programar = () => {
      clearTimeout(temporizador);
      if (activo && !document.hidden) temporizador = setTimeout(consultar, INTERVALO_MS);
    };

    async function consultar() {
      try {
        const res = await fetch("/api/estado", { cache: "no-store" });
        if (res.status === 401) return router.replace("/login"); // la sesión venció
        if (!res.ok) throw new Error(String(res.status));
        const datos: InstantaneaViva = await res.json();
        if (!activo) return;
        const llegadas = alertasNuevas(vistas.current, datos.alertas);
        for (const a of llegadas) {
          vistas.current.add(a.id);
          setTimeout(() => activo && cerrarAviso(a.id), DURACION_AVISO_MS);
        }
        if (llegadas.length) setNuevas((n) => apilarAvisos(n, llegadas));
        setInstantanea((antes) => fusionarInstantanea(antes, datos));
        setConexion("en-linea");
      } catch {
        if (activo) setConexion("sin-conexion");
      } finally {
        programar();
      }
    }

    const alCambiarVisibilidad = () => (document.hidden ? clearTimeout(temporizador) : consultar());
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    programar();
    return () => {
      activo = false;
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [cerrarAviso, router]);

  const valor = useMemo(() => ({ instantanea, conexion, nuevas, cerrarAviso }), [instantanea, conexion, nuevas, cerrarAviso]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
