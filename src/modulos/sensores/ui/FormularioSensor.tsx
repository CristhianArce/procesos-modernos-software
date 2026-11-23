"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { enviarJson } from "@/modulos/nodos/ui/enviar-json";

const UMBRALES = [
  { campo: "umbralVoltaje", etiqueta: "Umbral de voltaje (V)" },
  { campo: "umbralCorriente", etiqueta: "Umbral de corriente (A)" },
  { campo: "umbralPotencia", etiqueta: "Umbral de potencia (W)" },
] as const;

// Un umbral vacío no se envía: el sensor queda sin umbral para esa magnitud.
const numero = (valor: FormDataEntryValue | null) => (valor ? Number(valor) : undefined);

export function FormularioSensor({ nodoId }: { nodoId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const datos = new FormData(formulario);
    setEnviando(true);
    const fallo = await enviarJson("/api/sensores", {
      nodoId,
      nombre: datos.get("nombre"),
      ...Object.fromEntries(UMBRALES.map(({ campo }) => [campo, numero(datos.get(campo))])),
    });
    setError(fallo);
    setEnviando(false);
    if (fallo) return;
    formulario.reset();
    router.refresh(); // vuelve a leer los sensores en el servidor
  }

  return (
    <form onSubmit={enviar} className="mt-4 max-w-md space-y-3">
      <h3 className="font-semibold">Nuevo sensor</h3>
      <label className="block">
        <span className="text-sm text-tenue">Nombre</span>
        <input name="nombre" type="text" required maxLength={80} className="mt-1 w-full rounded border border-borde-fuerte bg-fondo-2 p-2" />
      </label>
      {UMBRALES.map(({ campo, etiqueta }) => (
        <label key={campo} className="block">
          <span className="text-sm text-tenue">{etiqueta}</span>
          <input name={campo} type="number" min="0" step="any" className="mt-1 w-full rounded border border-borde-fuerte bg-fondo-2 p-2" />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-critico">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="rounded bg-acento px-4 py-2 font-medium text-fondo disabled:opacity-60">
        Agregar sensor
      </button>
    </form>
  );
}
