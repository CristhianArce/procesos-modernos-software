/** Esqueleto de una pantalla mientras el servidor la arma (loading.tsx). */
export function Cargando({ etiqueta = "Cargando…" }: { etiqueta?: string }) {
  const bloque = "esqueleto rounded-sc-lg bg-panel";
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">{etiqueta}</span>
      <div className={`${bloque} h-8 w-48`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${bloque} h-24`} />
        ))}
      </div>
      <div className={`${bloque} h-96`} />
    </div>
  );
}
