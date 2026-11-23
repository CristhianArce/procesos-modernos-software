import "server-only";
import { logger } from "@/lib/logger";
import { registrarAlertas } from "@/modulos/alertas/service";
import { filasDeSensores } from "@/modulos/estado/service";
import { podarLecturas, registrarLecturas } from "@/modulos/lecturas/service";
import { baseDe, siguienteLectura, type Base } from "./deriva";

/** Las lecturas de más de una hora se podan (salvo la última de cada sensor) para que la tabla no crezca sin límite. */
export const RETENCION_MIN = 60;

type Opciones = { azar?: () => number; podarCada?: number };

/**
 * Simulador continuo: en cada paso, una lectura con deriva por cada sensor de un nodo conectado, sus alertas por el
 * mismo camino que el botón Simular (registrarAlertas) y, cada `podarCada` pasos, la poda de lecturas antiguas.
 */
export function crearSimulador({ azar = Math.random, podarCada = 24 }: Opciones = {}) {
  const deriva = new Map<string, { base: Base; previa: Base }>();
  let pasos = 0;

  return {
    async paso() {
      const filas = (await filasDeSensores()).filter((f) => f.conexion === "conectado" && f.sensorId !== null);
      const vigentes = new Set(filas.map((f) => f.sensorId!));
      for (const id of deriva.keys()) if (!vigentes.has(id)) deriva.delete(id); // sensores borrados o desconectados

      const nuevas = filas.map((f) => {
        const id = f.sensorId!;
        let s = deriva.get(id);
        if (!s) {
          const ultima = f.lectura && { voltaje: f.lectura.voltaje, corriente: f.lectura.corriente };
          s = { base: baseDe(ultima, f), previa: ultima ?? baseDe(null, f) };
          deriva.set(id, s);
        }
        const { lectura, deriva: siguiente } = siguienteLectura(s.previa, s.base, f, azar);
        s.previa = siguiente;
        return { sensorId: id, ...lectura };
      });

      const lecturas = nuevas.length ? await registrarLecturas(nuevas) : [];
      const alertas = lecturas.length
        ? await registrarAlertas(
            lecturas,
            filas.map((f) => ({ id: f.sensorId!, umbralVoltaje: f.umbralVoltaje, umbralCorriente: f.umbralCorriente, umbralPotencia: f.umbralPotencia })),
          )
        : [];
      pasos += 1;
      const podadas = pasos % podarCada === 0 ? await podarLecturas(RETENCION_MIN) : 0;
      return { lecturas: lecturas.length, alertas: alertas.length, podadas };
    },
  };
}

const global = globalThis as { __simuladorContinuo?: boolean };

/** Arranca el ciclo una sola vez por proceso (en desarrollo el módulo se recarga). Lo llama src/instrumentation.ts. */
export function iniciarSimuladorContinuo(ms: number) {
  if (global.__simuladorContinuo) return;
  global.__simuladorContinuo = true;
  const simulador = crearSimulador({ podarCada: Math.max(1, Math.round(60_000 / ms)) }); // poda una vez por minuto
  const ciclo = async () => {
    try {
      const r = await simulador.paso();
      if (r.alertas || r.podadas) logger.info(r, "simulador continuo");
    } catch (err) {
      logger.error({ err }, "falló un paso del simulador continuo");
    } finally {
      setTimeout(ciclo, ms).unref();
    }
  };
  logger.info({ ms }, "simulador continuo encendido");
  setTimeout(ciclo, ms).unref();
}
