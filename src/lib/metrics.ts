import "server-only";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

type Etiquetas = "metodo" | "ruta" | "estado";
type Metricas = {
  registro: Registry;
  peticiones: Counter<Etiquetas>;
  duracion: Histogram<Etiquetas>;
};

function crear(): Metricas {
  const registro = new Registry();
  collectDefaultMetrics({ register: registro });
  const labelNames = ["metodo", "ruta", "estado"] as const;
  return {
    registro,
    peticiones: new Counter({
      name: "http_requests_total",
      help: "Peticiones HTTP atendidas por los Route Handlers",
      labelNames,
      registers: [registro],
    }),
    duracion: new Histogram({
      name: "http_request_duration_seconds",
      help: "Duración de las peticiones HTTP en segundos",
      labelNames,
      registers: [registro],
    }),
  };
}

// En globalThis: el recargado en caliente de desarrollo volvería a registrar las métricas y prom-client fallaría.
const g = globalThis as typeof globalThis & { __metricas?: Metricas };
export const metricas = (g.__metricas ??= crear());

export function registrarPeticion(metodo: string, ruta: string, estado: number, segundos: number) {
  const etiquetas = { metodo, ruta, estado: String(estado) };
  metricas.peticiones.inc(etiquetas);
  metricas.duracion.observe(etiquetas, segundos);
}
