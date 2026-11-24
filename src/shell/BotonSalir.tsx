"use client";

import { useRouter } from "next/navigation";
import { Icono } from "@/modulos/ui/Icono";

export function BotonSalir() {
  const router = useRouter();
  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh(); // descarta lo que el router guardó del tablero
  }
  return (
    <button type="button" onClick={salir} className="boton-fantasma" aria-label="Cerrar sesión" title="Cerrar sesión">
      <Icono nombre="salir" tamano={18} />
    </button>
  );
}
