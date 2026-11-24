import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarHistorico } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const lectura = (id: string, tomadaEn: string): repo.LecturaHistorico => ({
  id,
  nodoId: "n1",
  nodoNombre: "Nodo histórico demo",
  sensorId: "s1",
  sensorNombre: "Medidor histórico A",
  voltaje: 122.5,
  corriente: 5,
  potencia: 600,
  tomadaEn,
});

beforeEach(() => vi.resetAllMocks());

describe("servicio del histórico", () => {
  it("#26 CA-1: devuelve pagina, porPagina 25, total, totalPaginas y las lecturas del repo", async () => {
    const lista = [lectura("l2", "2026-01-12T15:00:00.000Z"), lectura("l1", "2026-01-12T13:00:00.000Z")];
    r.contar.mockResolvedValue(26);
    r.listarPagina.mockResolvedValue(lista);
    expect(await consultarHistorico({ pagina: 1 })).toEqual({
      pagina: 1,
      porPagina: 25,
      total: 26,
      totalPaginas: 2,
      lecturas: lista,
    });
  });

  it("#26 CA-1: totalPaginas es el techo de total entre 25", async () => {
    r.listarPagina.mockResolvedValue([]);
    r.contar.mockResolvedValue(25);
    expect((await consultarHistorico({ pagina: 1 })).totalPaginas).toBe(1);
    r.contar.mockResolvedValue(51);
    expect((await consultarHistorico({ pagina: 1 })).totalPaginas).toBe(3);
  });

  it("#26 CA-2: pasa los filtros y la página al repo", async () => {
    r.contar.mockResolvedValue(0);
    r.listarPagina.mockResolvedValue([]);
    const filtros = { nodoId: "n1", sensorId: "s1", desde: "2026-01-10", hasta: "2026-01-12" };
    await consultarHistorico({ ...filtros, pagina: 2 });
    expect(r.listarPagina).toHaveBeenCalledWith(filtros, 2);
    expect(r.contar).toHaveBeenCalledWith(filtros);
  });

  it("#26 CA-3: con total 0 devuelve totalPaginas 0 y lecturas vacía", async () => {
    r.contar.mockResolvedValue(0);
    r.listarPagina.mockResolvedValue([]);
    expect(await consultarHistorico({ pagina: 1, desde: "2030-01-01" })).toEqual({
      pagina: 1,
      porPagina: 25,
      total: 0,
      totalPaginas: 0,
      lecturas: [],
    });
  });

  it("#26 CA-1: una página posterior a la última conserva el total y no trae lecturas", async () => {
    r.contar.mockResolvedValue(26);
    r.listarPagina.mockResolvedValue([]);
    const res = await consultarHistorico({ pagina: 5 });
    expect(res.pagina).toBe(5);
    expect(res.total).toBe(26);
    expect(res.totalPaginas).toBe(2);
    expect(res.lecturas).toEqual([]);
  });
});
