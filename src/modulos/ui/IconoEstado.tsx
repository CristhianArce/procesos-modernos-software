import { ESTADOS, type Estado } from "./estado";

/** Forma del estado en una caja de 16×16 con `currentColor`; decorativa, el texto va al lado. */
export function IconoEstado({ estado, tamano = 14 }: { estado: Estado; tamano?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={tamano} height={tamano} aria-hidden="true" focusable="false" className="shrink-0">
      {FORMAS[ESTADOS[estado].forma]}
    </svg>
  );
}

const FORMAS = {
  circulo: <circle cx="8" cy="8" r="6" fill="currentColor" />,
  triangulo: (
    <>
      <path d="M8 1.5 15 14.5H1z" fill="currentColor" />
      <path d="M8 6v4M8 11.6v.9" stroke="var(--sc-panel)" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  octagono: (
    <>
      <polygon points="5.2,1 10.8,1 15,5.2 15,10.8 10.8,15 5.2,15 1,10.8 1,5.2" fill="currentColor" />
      <path d="M8 4.5v4.5M8 11v.6" stroke="var(--sc-panel)" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  tachado: (
    <>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3.8 12.2 12.2 3.8" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  punteado: <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2.4 2.2" />,
};
