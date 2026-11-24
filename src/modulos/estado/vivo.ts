import type { AlertaReciente } from "./alarmas";
import type { EstadoNodo, Indicadores } from "./calculo";

/** Lo que viaja cada 2,5 s por GET /api/estado: sin nombres (el cliente ya los tiene) y con cifras redondeadas. */
export type NodoVivo = Pick<EstadoNodo, "id" | "conexion" | "nivel" | "voltaje" | "corriente" | "potencia" | "tomadaEn" | "alertasActivas">;
export type InstantaneaViva = { generadaEn: string; indicadores: Indicadores; nodos: NodoVivo[]; alertas: AlertaReciente[] };

const r2 = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);

export const compactarNodos = (nodos: EstadoNodo[]): NodoVivo[] =>
  nodos.map((n) => ({
    id: n.id,
    conexion: n.conexion,
    nivel: n.nivel,
    voltaje: r2(n.voltaje),
    corriente: r2(n.corriente),
    potencia: r2(n.potencia),
    tomadaEn: n.tomadaEn,
    alertasActivas: n.alertasActivas,
  }));
