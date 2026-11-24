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
    <form onSubmit={enviar} className="mt-6 grid max-w-3xl gap-3 border-t border-borde pt-4 sm:grid-cols-2">
      <h3 className="text-xs font-semibold tracking-wider text-tenue uppercase sm:col-span-2">Nuevo sensor</h3>
      <label className="block">
        <span className="etiqueta-campo">Nombre</span>
        <input name="nombre" type="text" required maxLength={80} className="campo" />
      </label>
      {UMBRALES.map(({ campo, etiqueta }) => (
        <label key={campo} className="block">
          <span className="etiqueta-campo">{etiqueta}</span>
          <input name={campo} type="number" min="0" step="any" className="campo" />
        </label>
      ))}
      {error && (
        <p role="alert" className="text-sm text-critico sm:col-span-2">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} className="boton-primario sm:col-span-2 sm:justify-self-start">
        Agregar sensor
      </button>
    </form>
  );
}
