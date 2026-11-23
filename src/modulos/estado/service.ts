import "server-only";
import { armarNodos, calcularIndicadores, type EstadoNodo, type Indicadores } from "./calculo";
import * as repo from "./repo";

export type { EstadoNodo, Indicadores } from "./calculo";

/** Una alerta cuenta como activa durante esta ventana (no hay confirmación de alarmas en el modelo). */
export const VENTANA_ALERTAS_MIN = 15;
/** Ancho de cada punto de las minitendencias: 30 puntos en la ventana. */
export const PASO_TENDENCIA_S = 30;

export type Instantanea = { nodos: EstadoNodo[]; indicadores: Indicadores; generadaEn: string };

export async function instantanea(): Promise<Instantanea> {
  const [filas, alertas, puntos] = await Promise.all([
    repo.filasSensores(),
    repo.alertasActivasPorNodo(VENTANA_ALERTAS_MIN),
    repo.tendencia(VENTANA_ALERTAS_MIN, PASO_TENDENCIA_S),
  ]);
  const nodos = armarNodos(filas, alertas);
  return { nodos, indicadores: calcularIndicadores(nodos, puntos), generadaEn: new Date().toISOString() };
}

export async function contarAlertasActivas(): Promise<number> {
  let total = 0;
  for (const n of (await repo.alertasActivasPorNodo(VENTANA_ALERTAS_MIN)).values()) total += n;
  return total;
}
