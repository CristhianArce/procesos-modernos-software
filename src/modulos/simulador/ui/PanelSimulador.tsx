import { sesionActual } from "@/lib/dal";
import { BotonSimular } from "./BotonSimular";

/** Panel de la ficha del nodo: el botón del simulador, solo para el administrador (decisión #11). */
export async function PanelSimulador({ nodoId }: { nodoId: string }) {
  const sesion = await sesionActual();
  if (sesion?.rol !== "administrador") {
    return <p className="mt-2 text-tenue">Solo un administrador puede simular lecturas.</p>;
  }
  return <BotonSimular nodoId={nodoId} />;
}
