type CuerpoError = { error?: string; detalles?: { campo: string; mensaje: string }[] };

/** POST con JSON a la API desde un Client Component. Devuelve null si salió bien, o el mensaje de error para mostrar. */
export async function enviarJson(url: string, cuerpo: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (res.ok) return null;
    const { error, detalles }: CuerpoError = await res.json().catch(() => ({}));
    const detalle = detalles?.map((d) => `${d.campo}: ${d.mensaje}`).join("; ");
    return [error ?? "No se pudo completar la acción.", detalle].filter(Boolean).join(" — ");
  } catch {
    return "No se pudo conectar con el servidor.";
  }
}
