import type { TipoNodo } from "../schema";

/** Etiqueta en español de cada tipo, para textos y lectores de pantalla. */
export const TIPO: Record<TipoNodo, string> = {
  generacion: "generación",
  subestacion: "subestación",
  transformador: "transformador",
  alimentador: "alimentador",
  carga: "carga",
};

// Símbolos unifilares simplificados, centrados en (0, 0) y de unos 44 px.
// El relleno y el trazo salen de CSS (.mimico-simbolo) para tomar el color del estado.
const FORMAS: Record<TipoNodo, React.ReactNode> = {
  generacion: (
    <>
      <circle r="22" />
      <path className="mimico-detalle" d="M-12 0q6-11 12 0t12 0" />
    </>
  ),
  subestacion: (
    <>
      <rect x="-22" y="-22" width="44" height="44" rx="5" />
      <path className="mimico-detalle" d="M-13-6h26M-13 6h26M0-14v8M0 6v8" />
    </>
  ),
  transformador: (
    <>
      <circle cx="-8" r="15" />
      <circle cx="8" r="15" />
    </>
  ),
  alimentador: (
    <>
      <rect x="-24" y="-15" width="48" height="30" rx="5" />
      <path className="mimico-detalle" d="M-13 0h22M3-6l6 6-6 6" />
    </>
  ),
  carga: <path d="M-21-15h42L0 19z" strokeLinejoin="round" />,
};

export function SimboloNodo({ tipo }: { tipo: TipoNodo }) {
  return <g className="mimico-simbolo">{FORMAS[tipo]}</g>;
}
