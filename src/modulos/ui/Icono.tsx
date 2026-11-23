/** Iconos de línea propios (24×24, `currentColor`), decorativos: el texto va al lado o en `aria-label` del control. */
const TRAZOS = {
  inicio: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  dashboard: "M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z",
  nodos: "M12 3v6M5 21v-4h14v4M12 9a3 3 0 1 0 0 .01M12 12v5M5 17a2 2 0 1 0 0 .01M19 17a2 2 0 1 0 0 .01",
  alarma: "M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  plegar: "M15 6l-6 6 6 6",
  desplegar: "M9 6l6 6-6 6",
  salir: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  rayo: "M13 2 4 14h7l-1 8 9-12h-7z",
  generico: "M5 5h14v14H5z",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tamano = 20, className }: { nombre: NombreIcono; tamano?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className ?? ""}`}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
