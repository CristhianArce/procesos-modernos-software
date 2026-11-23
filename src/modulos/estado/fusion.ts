import type { AlertaReciente } from "./alarmas";
import type { InstantaneaViva } from "./vivo";

/** Igualdad por valor de objetos planos de datos (JSON de la API). */
const iguales = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Reutiliza el objeto anterior de cada elemento (por `id`) que no cambió, para que los componentes memorizados
 * no se vuelvan a pintar. Si nada cambió, devuelve la misma lista.
 */
export function conservarIguales<T extends { id: string }>(antes: readonly T[], ahora: readonly T[]): T[] {
  const previos = new Map(antes.map((x) => [x.id, x]));
  let cambio = antes.length !== ahora.length;
  const resultado = ahora.map((x, i) => {
    const previo = previos.get(x.id);
    if (previo && iguales(previo, x)) {
      if (antes[i] !== previo) cambio = true;
      return previo;
    }
    cambio = true;
    return x;
  });
  return cambio ? resultado : (antes as T[]);
}

/** La instantánea nueva, reutilizando todo lo que no cambió de la anterior (repintar solo lo que cambió). */
export function fusionarInstantanea(antes: InstantaneaViva, ahora: InstantaneaViva): InstantaneaViva {
  return {
    generadaEn: ahora.generadaEn,
    indicadores: iguales(antes.indicadores, ahora.indicadores) ? antes.indicadores : ahora.indicadores,
    nodos: conservarIguales(antes.nodos, ahora.nodos),
    alertas: conservarIguales(antes.alertas, ahora.alertas),
  };
}

export const alertasNuevas = (vistas: ReadonlySet<string>, alertas: readonly AlertaReciente[]) => alertas.filter((a) => !vistas.has(a.id));

const claveAviso = (a: AlertaReciente) => `${a.nodoId}|${a.sensorNombre}|${a.magnitud}`;

/** Avisos visibles tras llegar `llegadas` (las más nuevas primero): uno por sensor y magnitud, el más reciente. */
export function apilarAvisos(actuales: readonly AlertaReciente[], llegadas: readonly AlertaReciente[]): AlertaReciente[] {
  const vistos = new Set<string>();
  return [...llegadas, ...actuales].filter((a) => {
    const clave = claveAviso(a);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
