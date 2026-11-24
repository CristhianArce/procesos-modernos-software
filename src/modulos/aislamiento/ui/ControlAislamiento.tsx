"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { EstadoNodo } from "@/modulos/nodos/repo";

const TEXTOS = {
  conectado: {
    situacion: "El nodo está conectado.",
    boton: "Aislar nodo",
    pregunta: "¿Aislar este nodo?",
    aviso: "El nodo quedará desconectado. El cambio es simulado: no se envían órdenes a equipos reales.",
    destino: "desconectado",
  },
  desconectado: {
    situacion: "El nodo está desconectado.",
    boton: "Reconectar nodo",
    pregunta: "¿Reconectar este nodo?",
    aviso: "El nodo volverá a quedar conectado. El cambio es simulado: no se envían órdenes a equipos reales.",
    destino: "conectado",
  },
} as const;

async function pedirCambio(nodoId: string, estado: EstadoNodo): Promise<string | null> {
  try {
    const res = await fetch(`/api/aislamiento/nodos/${nodoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) return null;
    const { error }: { error?: string } = await res.json().catch(() => ({}));
    return error ?? "No se pudo cambiar el estado del nodo.";
  } catch {
    return "No se pudo conectar con el servidor.";
  }
}

/** Aislar o reconectar un nodo, con confirmación (RN-2). La ficha se vuelve a leer del servidor al terminar (CA-1, CA-2). */
export function ControlAislamiento({ nodoId, estado }: { nodoId: string; estado: EstadoNodo }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, iniciarRefresco] = useTransition();
  const principal = useRef<HTMLButtonElement>(null);
  const confirmar = useRef<HTMLButtonElement>(null);
  const textos = TEXTOS[estado];
  const ocupado = enviando || refrescando;

  useEffect(() => {
    if (confirmando) confirmar.current?.focus();
  }, [confirmando]);

  function cancelar() {
    setConfirmando(false);
    principal.current?.focus();
  }

  async function aplicar() {
    setEnviando(true);
    const fallo = await pedirCambio(nodoId, textos.destino);
    setEnviando(false);
    setError(fallo);
    if (fallo) return;
    setConfirmando(false);
    iniciarRefresco(() => router.refresh()); // el indicador «Conexión» y este panel leen el estado nuevo
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-tenue">{textos.situacion}</p>
      <button
        ref={principal}
        type="button"
        onClick={() => setConfirmando(true)}
        disabled={ocupado}
        aria-expanded={confirmando}
        aria-controls="confirmacion-aislamiento"
        className="boton-primario"
      >
        {textos.boton}
      </button>
      {confirmando && (
        <div id="confirmacion-aislamiento" role="group" aria-labelledby="pregunta-aislamiento" className="space-y-2">
          <p id="pregunta-aislamiento" className="font-medium text-texto">
            {textos.pregunta}
          </p>
          <p className="text-sm text-tenue">{textos.aviso}</p>
          <div className="flex gap-2">
            <button ref={confirmar} type="button" onClick={aplicar} disabled={ocupado} className="boton-primario">
              Confirmar
            </button>
            <button type="button" onClick={cancelar} disabled={ocupado} className="boton-fantasma">
              Cancelar
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
    </div>
  );
}
