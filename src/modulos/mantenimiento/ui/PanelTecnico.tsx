import { Suspense } from "react";
import { sesionActual } from "@/lib/dal";
import { logger } from "@/lib/logger";
import { Cargando } from "@/modulos/ui/Cargando";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { tecnicoAsignado, tecnicosDisponibles, type Tecnico } from "../service";
import { AsignarTecnico } from "./AsignarTecnico";
import { TecnicoAsignado } from "./TecnicoAsignado";

async function TecnicoDelNodo({ nodoId }: { nodoId: string }) {
  const esAdmin = (await sesionActual())?.rol === "administrador";
  let tecnico: Tecnico | null;
  let tecnicos: Tecnico[] = [];
  try {
    [tecnico, tecnicos] = await Promise.all([tecnicoAsignado(nodoId), esAdmin ? tecnicosDisponibles() : []]);
  } catch (error) {
    logger.error({ err: error, nodoId }, "no se pudo cargar el técnico asignado");
    return <EstadoError titulo="No se pudo cargar el técnico asignado" />;
  }
  return (
    <>
      <TecnicoAsignado tecnico={tecnico} />
      {esAdmin && <AsignarTecnico nodoId={nodoId} tecnicos={tecnicos} asignadoId={tecnico?.id ?? null} />}
    </>
  );
}

/** Panel de la ficha: ambos roles ven el técnico; solo el administrador lo cambia. Ocultar el selector es cosmético: la API exige el rol (CA-4). */
export function PanelTecnico({ nodoId }: { nodoId: string }) {
  return (
    <Suspense fallback={<Cargando etiqueta="Cargando técnico asignado…" />}>
      <TecnicoDelNodo nodoId={nodoId} />
    </Suspense>
  );
}
