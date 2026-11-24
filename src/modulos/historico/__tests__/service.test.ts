import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarHistorico } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);

const fila = (i: number) => ({
  id: `l${i}`,
  sensorId: "s1",
  nodoId: "n1",
  nodoNombre: "Nodo",
  sensorNombre: "Sensor",
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-11-24T10:00:00.000Z",
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("servicio del histórico", () => {
  it("#26 CA-1: la página 1 pide 25 filas desde el desplazamiento 0 y arma la respuesta", async () => {
    const lecturas = Array.from({ length: 25 }, (_, i) => fila(i));
    r.consultar.mockResolvedValue({ lecturas, total: 26 });
    const res = await consultarHistorico({ pagina: 1 });
    expect(r.consultar).toHaveBeenCalledWith(expect.objectContaining({ limite: 25, desplazamiento: 0 }));
    expect(res).toEqual({ lecturas, total: 26, pagina: 1, tamano: 25 });
  });

  it("#26 CA-1: la página 2 pide el desplazamiento 25", async () => {
    r.consultar.mockResolvedValue({ lecturas: [fila(1)], total: 26 });
    const res = await consultarHistorico({ pagina: 2 });
    expect(r.consultar).toHaveBeenCalledWith(expect.objectContaining({ limite: 25, desplazamiento: 25 }));
    expect(res.pagina).toBe(2);
    expect(res.lecturas).toHaveLength(1);
  });

  it("#26 CA-2: pasa los filtros al repo", async () => {
    r.consultar.mockResolvedValue({ lecturas: [], total: 0 });
    const filtros = { nodoId: "n1", sensorId: "s1", desde: "2026-11-24T10:00:00Z", hasta: "2026-11-24T11:00:00Z", pagina: 1 };
    await consultarHistorico(filtros);
    expect(r.consultar).toHaveBeenCalledWith(
      expect.objectContaining({ nodoId: "n1", sensorId: "s1", desde: filtros.desde, hasta: filtros.hasta }),
    );
  });

  it("#26 CA-3: sin coincidencias devuelve lista vacía y total 0 sin error", async () => {
    r.consultar.mockResolvedValue({ lecturas: [], total: 0 });
    expect(await consultarHistorico({ pagina: 1 })).toEqual({ lecturas: [], total: 0, pagina: 1, tamano: 25 });
  });

  it("#26 CA-3: una página más allá de la última conserva el total real", async () => {
    r.consultar.mockResolvedValue({ lecturas: [], total: 26 });
    const res = await consultarHistorico({ pagina: 9 });
    expect(r.consultar).toHaveBeenCalledWith(expect.objectContaining({ desplazamiento: 200 }));
    expect(res).toEqual({ lecturas: [], total: 26, pagina: 9, tamano: 25 });
  });
});
