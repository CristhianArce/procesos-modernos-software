"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/modulos/nodos/ui/enviar-json";

export function BotonSimular({ nodoId }: { nodoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function simular() {
    setEnviando(true);
    const fallo = await enviarJson("/api/simulador", { nodoId });
    setError(fallo);
    setEnviando(false);
    if (!fallo) router.refresh(); // el panel de sensores vuelve a leer la última lectura
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={simular} disabled={enviando} className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60">
        Simular lecturas
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
