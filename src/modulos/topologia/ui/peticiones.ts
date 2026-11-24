/** Resultado de una llamada a la API desde un componente de cliente, con el mensaje de error listo para mostrar. */
export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

export async function pedir<T = unknown>(url: string, metodo = "GET", cuerpo?: unknown): Promise<Resultado<T>> {
  try {
    const res = await fetch(url, {
      method: metodo,
      cache: "no-store",
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    if (res.ok) return { ok: true, datos: (res.status === 204 ? undefined : await res.json()) as T };
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: error ?? `Error ${res.status}` };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }
}
