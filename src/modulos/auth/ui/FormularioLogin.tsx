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
    <form onSubmit={enviar} className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-texto">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-tenue">Usa tu cuenta de operador.</p>
      </div>
      <label className="block">
        <span className="etiqueta-campo">Usuario</span>
        <input name="usuario" type="text" autoComplete="username" required maxLength={64} className="campo" />
      </label>
      <label className="block">
        <span className="etiqueta-campo">Contraseña</span>
        <input name="contrasena" type="password" autoComplete="current-password" required maxLength={128} className="campo" />
      </label>
      {error && (
        <p role="alert" className="rounded-sc border border-critico/40 bg-critico/10 px-3 py-2 text-sm text-critico">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="boton-primario w-full">
        Iniciar sesión
      </button>
    </form>
  );
}
