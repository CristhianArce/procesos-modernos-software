import type { Magnitud } from "@/modulos/alertas/magnitudes";

// Sin Zod: la API no recibe datos del cliente (el destinatario sale de la sesión) y la interfaz importa estos tipos.
export type Notificacion = { id: string; sensor: string; magnitud: Magnitud; valor: number; fecha: string; leida: boolean };
export type RespuestaNotificaciones = { notificaciones: Notificacion[]; noLeidas: number };
