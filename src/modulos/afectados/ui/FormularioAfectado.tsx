"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "@/modulos/nodos/ui/enviar-json";

/** Alta de un afectado en el panel de la ficha; solo el administrador lo ve, y la API exige el rol (CA-1, CA-4). */
export function FormularioAfectado({ nodoId }: { nodoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    setEnviando(true);
    const fallo = await enviarJson("/api/afectados", { nodoId, alias: new FormData(formulario).get("alias") });
    setError(fallo);
    setEnviando(false);
    if (fallo) return;
    formulario.reset();
    router.refresh(); // vuelve a leer la lista y el total en el servidor
  }

  return (
    <form onSubmit={enviar} data-testid="formulario-afectado" className="mt-6 grid max-w-md gap-3 border-t border-borde pt-4">
      <h3 className="text-xs font-semibold tracking-wider text-tenue uppercase">Agregar afectado</h3>
      <label className="block">
        <span className="etiqueta-campo">Alias</span>
        <input name="alias" type="text" required maxLength={80} className="campo" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="boton-primario justify-self-start">
        Agregar afectado
      </button>
    </form>
  );
}
