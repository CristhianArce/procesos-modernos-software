"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "./enviar-json";

export function FormularioNodo() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const datos = new FormData(formulario);
    setEnviando(true);
    const fallo = await enviarJson("/api/nodos", { nombre: datos.get("nombre"), ubicacion: datos.get("ubicacion") });
    setError(fallo);
    setEnviando(false);
    if (fallo) return;
    formulario.reset();
    router.refresh(); // vuelve a leer la lista en el servidor
  }

  return (
    <form onSubmit={enviar} className="mt-6 max-w-md space-y-3">
      <h2 className="text-lg font-semibold">Nuevo nodo</h2>
      <label className="block">
        <span className="text-sm text-gray-700">Nombre</span>
        <input name="nombre" type="text" required maxLength={80} className="mt-1 w-full rounded border border-gray-300 p-2" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-700">Ubicación</span>
        <input name="ubicacion" type="text" maxLength={120} className="mt-1 w-full rounded border border-gray-300 p-2" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60">
        Crear nodo
      </button>
    </form>
  );
}
