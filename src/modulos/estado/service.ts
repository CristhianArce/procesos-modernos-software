import "server-only";
import { lecturasRecientesPorSensor } from "@/modulos/lecturas/service";
import { obtenerNodo } from "@/modulos/nodos/service";
import { listarSensores } from "@/modulos/sensores/service";
import type { AlertaReciente } from "./alarmas";
import { armarNodos, calcularIndicadores, type EstadoNodo, type Indicadores } from "./calculo";
import * as repo from "./repo";
import { compactarNodos, type InstantaneaViva } from "./vivo";

export type { EstadoNodo, Indicadores } from "./calculo";
export type { InstantaneaViva } from "./vivo";

/** Una alerta cuenta como activa durante esta ventana (no hay confirmación de alarmas en el modelo). */
export const VENTANA_ALERTAS_MIN = 15;
/** Ancho de cada punto de las minitendencias: 30 puntos en la ventana. */
export const PASO_TENDENCIA_S = 30;
/** Alertas que viajan en cada instantánea para el panel de alarmas y los avisos. */
export const ALERTAS_EN_INSTANTANEA = 30;
/** Lecturas por sensor en el panel lateral del nodo y alertas que muestra. */
export const LECTURAS_EN_DETALLE = 30;
export const ALERTAS_EN_DETALLE = 10;

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

/** Instantánea compacta para el sondeo del cliente (GET /api/estado). */
export async function instantaneaViva(): Promise<InstantaneaViva> {
  const [{ nodos, indicadores, generadaEn }, alertas] = await Promise.all([instantanea(), repo.alertasRecientes({ limite: ALERTAS_EN_INSTANTANEA })]);
  return { generadaEn, indicadores, nodos: compactarNodos(nodos), alertas };
}

export type LecturaDetalle = { voltaje: number; corriente: number; potencia: number; tomadaEn: string };
export type SensorDetalle = {
  id: string;
  nombre: string;
  umbralVoltaje: number | null;
  umbralCorriente: number | null;
  umbralPotencia: number | null;
  lecturas: LecturaDetalle[];
};
export type DetalleNodo = { id: string; sensores: SensorDetalle[]; alertas: AlertaReciente[] };

/** Sensores con sus umbrales y últimas lecturas (de la más antigua a la más reciente) y alertas del nodo; 404 si no existe. */
export async function detalleNodo(id: string): Promise<DetalleNodo> {
  await obtenerNodo(id);
  const [sensores, alertas] = await Promise.all([listarSensores(id), repo.alertasRecientes({ limite: ALERTAS_EN_DETALLE, nodoId: id })]);
  const series = await lecturasRecientesPorSensor(
    sensores.map((s) => s.id),
    LECTURAS_EN_DETALLE,
  );
  return {
    id,
    sensores: sensores.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      umbralVoltaje: s.umbralVoltaje,
      umbralCorriente: s.umbralCorriente,
      umbralPotencia: s.umbralPotencia,
      lecturas: (series.get(s.id) ?? []).map(({ voltaje, corriente, potencia, tomadaEn }) => ({ voltaje, corriente, potencia, tomadaEn })),
    })),
    alertas,
  };
}

/** Una fila por sensor con su nodo, sus umbrales y su última lectura (la usa el simulador continuo). */
export const filasDeSensores = () => repo.filasSensores();
