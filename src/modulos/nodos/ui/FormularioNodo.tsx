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
        <span className="text-sm text-tenue">Nombre</span>
        <input name="nombre" type="text" required maxLength={80} className="mt-1 w-full rounded border border-borde-fuerte bg-fondo-2 p-2" />
      </label>
      <label className="block">
        <span className="text-sm text-tenue">Ubicación</span>
        <input name="ubicacion" type="text" maxLength={120} className="mt-1 w-full rounded border border-borde-fuerte bg-fondo-2 p-2" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="rounded bg-acento px-4 py-2 font-medium text-fondo disabled:opacity-60">
        Crear nodo
      </button>
    </form>
  );
}
