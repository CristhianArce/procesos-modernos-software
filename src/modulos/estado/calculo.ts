import type { Magnitud } from "@/modulos/alertas/schema";
import { nivelFrenteAUmbral, peorEstado, type Estado } from "@/modulos/ui/estado";

/** Funciones puras del estado de la red: sin BD, para probarlas sin Postgres y reusarlas en el cliente. */

export type Conexion = "conectado" | "desconectado";
export type UltimaLectura = Record<Magnitud, number> & { tomadaEn: string };

/** Una fila por sensor (o una por nodo sin sensores, con `sensorId` null), con su última lectura. */
export type FilaSensor = {
  nodoId: string;
  nombre: string;
  ubicacion: string | null;
  conexion: Conexion;
  sensorId: string | null;
  umbralVoltaje: number | null;
  umbralCorriente: number | null;
  umbralPotencia: number | null;
  lectura: UltimaLectura | null;
};

export type EstadoNodo = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  conexion: Conexion;
  nivel: Estado;
  sensores: number;
  /** Tensión media de los sensores; corriente y potencia, sumadas (decisión #11 del plan). */
  voltaje: number | null;
  corriente: number | null;
  potencia: number | null;
  tomadaEn: string | null;
  alertasActivas: number;
};

/** Un intervalo de la ventana de tendencia, del más antiguo al más reciente. */
export type PuntoTendencia = { tensionMedia: number | null; potenciaTotal: number | null; nodosReportando: number; alertas: number };

export type Indicadores = {
  potenciaTotal: number | null;
  tensionMedia: number | null;
  nodosConectados: number;
  nodosDesconectados: number;
  nodosTotales: number;
  alertasActivas: number;
  tendencia: { potencia: number[]; tension: number[]; nodos: number[]; alertas: number[] };
};

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => (xs.length ? suma(xs) / xs.length : null);

function nivelDeSensor(f: FilaSensor): Estado {
  const l = f.lectura;
  if (!l) return "sin-datos";
  return peorEstado([
    nivelFrenteAUmbral(l.voltaje, f.umbralVoltaje),
    nivelFrenteAUmbral(l.corriente, f.umbralCorriente),
    nivelFrenteAUmbral(l.potencia, f.umbralPotencia),
  ]);
}

function armarNodo(filas: FilaSensor[], alertasActivas: number): EstadoNodo {
  const { nodoId, nombre, ubicacion, conexion } = filas[0];
  const sensores = filas.filter((f) => f.sensorId !== null);
  const lecturas = sensores.flatMap((f) => (f.lectura ? [f.lectura] : []));
  const conDatos = lecturas.length > 0;
  return {
    id: nodoId,
    nombre,
    ubicacion,
    conexion,
    nivel: conexion === "desconectado" ? "desconectado" : conDatos ? peorEstado(sensores.map(nivelDeSensor).filter((e) => e !== "sin-datos")) : "sin-datos",
    sensores: sensores.length,
    voltaje: media(lecturas.map((l) => l.voltaje)),
    corriente: conDatos ? suma(lecturas.map((l) => l.corriente)) : null,
    potencia: conDatos ? suma(lecturas.map((l) => l.potencia)) : null,
    tomadaEn: conDatos ? lecturas.map((l) => l.tomadaEn).sort().at(-1)! : null,
    alertasActivas,
  };
}

/** Agrupa las filas por nodo, en el orden en que llegan. */
export function armarNodos(filas: FilaSensor[], alertasPorNodo: ReadonlyMap<string, number>): EstadoNodo[] {
  const grupos = new Map<string, FilaSensor[]>();
  for (const f of filas) grupos.set(f.nodoId, [...(grupos.get(f.nodoId) ?? []), f]);
  return [...grupos.entries()].map(([id, g]) => armarNodo(g, alertasPorNodo.get(id) ?? 0));
}

const definidos = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);

export function calcularIndicadores(nodos: EstadoNodo[], tendencia: PuntoTendencia[]): Indicadores {
  const activos = nodos.filter((n) => n.conexion === "conectado" && n.potencia !== null);
  const conectados = nodos.filter((n) => n.conexion === "conectado").length;
  return {
    potenciaTotal: activos.length ? suma(activos.map((n) => n.potencia!)) : null,
    tensionMedia: media(definidos(activos.map((n) => n.voltaje))),
    nodosConectados: conectados,
    nodosDesconectados: nodos.length - conectados,
    nodosTotales: nodos.length,
    alertasActivas: suma(nodos.map((n) => n.alertasActivas)),
    tendencia: {
      potencia: definidos(tendencia.map((p) => p.potenciaTotal)),
      tension: definidos(tendencia.map((p) => p.tensionMedia)),
      nodos: tendencia.map((p) => p.nodosReportando),
      alertas: tendencia.map((p) => p.alertas),
    },
  };
}
