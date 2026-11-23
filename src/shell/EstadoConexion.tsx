import type { Conexion } from "@/modulos/estado/ui/EstadoVivo";

const VISTA = {
  "en-linea": { texto: "En línea", estado: "normal" },
  conectando: { texto: "Conectando…", estado: "sin-datos" },
  "sin-conexion": { texto: "Sin conexión", estado: "critico" },
} as const;

/** Estado de la conexión con los datos (lo alimenta el sondeo de /api/estado). */
export function EstadoConexion({ conexion }: { conexion: Conexion }) {
  const { texto, estado } = VISTA[conexion];
  return (
    <span role="status" data-estado={estado} className="inline-flex items-center gap-2 text-sm text-tenue">
      <span className="relative flex size-2.5">
        {conexion === "en-linea" && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--sc-estado)] opacity-60" />}
        <span className="relative size-2.5 rounded-full bg-[var(--sc-estado)]" />
      </span>
      {texto}
    </span>
  );
}
