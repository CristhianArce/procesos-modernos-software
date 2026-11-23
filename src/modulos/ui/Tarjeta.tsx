import type { ReactNode } from "react";

type Props = { titulo?: ReactNode; acciones?: ReactNode; children: ReactNode; className?: string };

/** Superficie base de la sala de control: borde, fondo de panel y encabezado opcional. */
export function Tarjeta({ titulo, acciones, children, className = "" }: Props) {
  return (
    <section className={`rounded-sc-lg border border-borde bg-panel shadow-sc ${className}`}>
      {(titulo || acciones) && (
        <header className="flex items-center justify-between gap-2 border-b border-borde px-4 py-2.5">
          {titulo && <h2 className="text-xs font-semibold tracking-wider text-tenue uppercase">{titulo}</h2>}
          {acciones}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
