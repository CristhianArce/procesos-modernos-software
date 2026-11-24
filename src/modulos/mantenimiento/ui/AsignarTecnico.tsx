"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Tecnico } from "../repo";

type Props = { nodoId: string; tecnicos: Tecnico[]; asignadoId: string | null };

async function pedirAsignacion(nodoId: string, tecnicoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/mantenimiento/nodos/${nodoId}/tecnico`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tecnicoId }),
    });
    if (res.ok) return null;
    const { error }: { error?: string } = await res.json().catch(() => ({}));
    return error ?? "No se pudo asignar el técnico.";
  } catch {
    return "No se pudo conectar con el servidor.";
  }
}

/** Selector del técnico del nodo, solo para el administrador. Al asignar, la ficha se vuelve a leer del servidor (CA-1). */
export function AsignarTecnico({ nodoId, tecnicos, asignadoId }: Props) {
  const router = useRouter();
  const [elegido, setElegido] = useState(asignadoId ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, iniciarRefresco] = useTransition();

  if (tecnicos.length === 0) return <p className="text-sm text-tenue">No hay técnicos registrados.</p>;

  async function asignar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    const fallo = await pedirAsignacion(nodoId, elegido);
    setEnviando(false);
    setError(fallo);
    if (!fallo) iniciarRefresco(() => router.refresh());
  }

  const campo = `selector-tecnico-${nodoId}`;
  return (
    <form onSubmit={asignar} className="mt-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={campo} className="etiqueta-campo">
            Técnico
          </label>
          <select id={campo} data-testid="selector-tecnico" value={elegido} onChange={(e) => setElegido(e.target.value)} className="campo">
            <option value="">Elige un técnico</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombreUsuario}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={!elegido || enviando || refrescando} className="boton-primario">
          Asignar
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
    </form>
  );
}
