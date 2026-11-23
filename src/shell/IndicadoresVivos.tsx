"use client";

import Link from "next/link";
import { useEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import { Icono } from "@/modulos/ui/Icono";
import { EstadoConexion } from "./EstadoConexion";

/** Conexión con los datos, según el último sondeo de /api/estado. */
export function ConexionViva() {
  return <EstadoConexion conexion={useEstadoVivo().conexion} />;
}

/** Alertas activas (15 min) en vivo; enlaza al panel de alarmas del dashboard. */
export function AlertasVivas() {
  const n = useEstadoVivo().instantanea.indicadores.alertasActivas;
  return (
    <Link
      href="/dashboard#alarmas"
      data-tono={n > 0 ? "critico" : "normal"}
      className="inline-flex items-center gap-1.5 rounded-sc border border-[color-mix(in_srgb,var(--sc-estado)_45%,transparent)] bg-[color-mix(in_srgb,var(--sc-estado)_12%,transparent)] px-2.5 py-1 text-sm text-[var(--sc-estado)] hover:bg-[color-mix(in_srgb,var(--sc-estado)_20%,transparent)]"
    >
      <Icono nombre="alarma" tamano={16} />
      <span className="cifra font-semibold">{n}</span>
      <span className="max-lg:sr-only">{n === 1 ? "alerta activa" : "alertas activas"}</span>
    </Link>
  );
}
