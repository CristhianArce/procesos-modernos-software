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
    <div>
      <button type="button" onClick={simular} disabled={enviando} className="boton-primario">
        Simular lecturas
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-critico">
          {error}
        </p>
      )}
    </div>
  );
}
