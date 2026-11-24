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
    <form onSubmit={enviar} className="space-y-3">
      <label className="block">
        <span className="etiqueta-campo">Nombre</span>
        <input name="nombre" type="text" required maxLength={80} className="campo" />
      </label>
      <label className="block">
        <span className="etiqueta-campo">Ubicación</span>
        <input name="ubicacion" type="text" maxLength={120} className="campo" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="boton-primario">
        Crear nodo
      </button>
    </form>
  );
}
