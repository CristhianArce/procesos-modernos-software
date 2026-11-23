/** Estados visuales de la sala de control, del menos al más grave (decisión #3 del plan). */
export const ORDEN_ESTADOS = ["sin-datos", "normal", "advertencia", "critico", "desconectado"] as const;
export type Estado = (typeof ORDEN_ESTADOS)[number];

export type Forma = "circulo" | "triangulo" | "octagono" | "tachado" | "punteado";

/** Etiqueta y forma de cada estado: el color nunca va solo. */
export const ESTADOS: Record<Estado, { etiqueta: string; forma: Forma }> = {
  normal: { etiqueta: "Normal", forma: "circulo" },
  advertencia: { etiqueta: "Advertencia", forma: "triangulo" },
  critico: { etiqueta: "Crítico", forma: "octagono" },
  desconectado: { etiqueta: "Desconectado", forma: "tachado" },
  "sin-datos": { etiqueta: "Sin datos", forma: "punteado" },
};

/** Fracción del umbral desde la que un valor se muestra en advertencia (decisión #4). */
export const FRACCION_ADVERTENCIA = 0.98;

/** Nivel de un valor frente a su umbral máximo: por encima, crítico (lo que genera una alerta). */
export function nivelFrenteAUmbral(valor: number | null, umbral: number | null): Estado {
  if (valor === null) return "sin-datos";
  if (umbral === null) return "normal";
  if (valor > umbral) return "critico";
  return valor >= umbral * FRACCION_ADVERTENCIA ? "advertencia" : "normal";
}

/** El estado más grave de una lista; vacía, sin datos. */
export const peorEstado = (estados: readonly Estado[]): Estado =>
  estados.reduce<Estado>((peor, e) => (ORDEN_ESTADOS.indexOf(e) > ORDEN_ESTADOS.indexOf(peor) ? e : peor), "sin-datos");
