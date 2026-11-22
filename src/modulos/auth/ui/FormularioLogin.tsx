"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const mensajeDe = (estado: number, cuerpo: { error?: string } | null) =>
  estado === 400 ? "Escribe tu usuario y tu contraseña." : (cuerpo?.error ?? "No se pudo iniciar sesión.");

export function FormularioLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const datos = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: datos.get("usuario"), contrasena: datos.get("contrasena") }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh(); // descarta lo que el router guardó cuando el tablero redirigía a /login
        return;
      }
      setError(mensajeDe(res.status, await res.json().catch(() => null)));
    } catch {
      setError("No se pudo conectar con el servidor.");
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <label className="block">
        <span className="text-sm text-gray-700">Usuario</span>
        <input name="usuario" type="text" autoComplete="username" required maxLength={64} className="mt-1 w-full rounded border border-gray-300 p-2" />
      </label>
      <label className="block">
        <span className="text-sm text-gray-700">Contraseña</span>
        <input name="contrasena" type="password" autoComplete="current-password" required maxLength={128} className="mt-1 w-full rounded border border-gray-300 p-2" />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="w-full rounded bg-gray-900 p-2 text-white disabled:opacity-60">
        Iniciar sesión
      </button>
    </form>
  );
}
