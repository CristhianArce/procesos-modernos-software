/** Constantes y tipos del histórico compartidos con la interfaz: sin Zod ni código de servidor. */

/** Lecturas por página (RN-2). */
export const TAMANO_PAGINA = 25;

/** Una lectura del histórico con el nombre de su sensor y de su nodo. */
export type FilaHistorico = {
  id: string;
  sensorId: string;
  sensorNombre: string;
  nodoId: string;
  nodoNombre: string;
  voltaje: number;
  corriente: number;
  potencia: number;
  tomadaEn: string;
};

/** Respuesta de `GET /api/historico`. */
export type PaginaHistorico = { lecturas: FilaHistorico[]; total: number; pagina: number; tamano: number };
