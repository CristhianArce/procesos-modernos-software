"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

async function pedirMarcado(id: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/notificaciones/${id}`, { method: "PATCH" });
    if (res.ok) return null;
    const { error }: { error?: string } = await res.json().catch(() => ({}));
    return error ?? "No se pudo marcar la notificación.";
  } catch {
    return "No se pudo conectar con el servidor.";
  }
}

/** Marca una notificación como leída; el centro se vuelve a leer del servidor al terminar (CA-1, RN-3). */
export function BotonMarcarLeida({ id }: { id: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, iniciarRefresco] = useTransition();
  const ocupado = enviando || refrescando;

  async function marcar() {
    setEnviando(true);
    const fallo = await pedirMarcado(id);
    setEnviando(false);
    setError(fallo);
    if (!fallo) iniciarRefresco(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" data-testid="marcar-leida" onClick={marcar} disabled={ocupado} className="boton-fantasma">
        {ocupado ? "Marcando…" : "Marcar como leída"}
      </button>
      {error && (
        <p role="alert" data-testid="error-marcar" className="text-sm text-critico">
          {error}
        </p>
      )}
    </div>
  );
}
