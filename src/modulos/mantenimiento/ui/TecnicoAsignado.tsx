import { EstadoVacio } from "@/modulos/ui/EstadoVacio";

/** Quién responde por el nodo, o el estado vacío si nadie (CA-1). */
export function TecnicoAsignado({ tecnico }: { tecnico: { id: string; nombreUsuario: string } | null }) {
  if (!tecnico) return <EstadoVacio titulo="Sin técnico asignado" />;
  return (
    <dl className="flex gap-2 text-sm">
      <dt className="text-tenue">Responsable</dt>
      <dd data-testid="tecnico-asignado" className="font-medium text-texto">
        {tecnico.nombreUsuario}
      </dd>
    </dl>
  );
}
