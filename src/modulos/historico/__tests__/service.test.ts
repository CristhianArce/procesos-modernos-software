import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarHistorico } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const fila = (n: number): repo.FilaHistorico => ({
  id: `l-${n}`,
  sensorId: "s1",
  sensorNombre: "Sensor 1",
  nodoId: "n1",
  nodoNombre: "Nodo 1",
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-11-22T00:00:00.000Z",
});

beforeEach(() => vi.resetAllMocks());

describe("servicio del histórico", () => {
  it("#26 CA-1: arma la página con items, pagina, tamano 25 y total", async () => {
    const items = Array.from({ length: 25 }, (_, i) => fila(i));
    r.consultar.mockResolvedValue(items);
    r.contar.mockResolvedValue(26);
    const filtros = { pagina: 1 };

    const resultado = await consultarHistorico(filtros);

    expect(resultado).toEqual({ items, pagina: 1, tamano: 25, total: 26 });
    expect(r.consultar).toHaveBeenCalledWith(filtros);
    expect(r.contar).toHaveBeenCalledWith(filtros);
  });

  it("#26 CA-1: la página 2 conserva el número de página pedido", async () => {
    r.consultar.mockResolvedValue([fila(26)]);
    r.contar.mockResolvedValue(26);
    const resultado = await consultarHistorico({ pagina: 2 });
    expect(resultado.pagina).toBe(2);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.tamano).toBe(25);
  });

  it("#26 CA-2: pasa los filtros tal cual al repo", async () => {
    r.consultar.mockResolvedValue([]);
    r.contar.mockResolvedValue(0);
    const filtros = { nodoId: "n1", sensorId: "s1", desde: "2026-11-01T00:00:00Z", hasta: "2026-11-02T00:00:00Z", pagina: 1 };
    await consultarHistorico(filtros);
    expect(r.consultar).toHaveBeenCalledWith(filtros);
    expect(r.contar).toHaveBeenCalledWith(filtros);
  });

  it("#26 CA-3: sin coincidencias devuelve la lista vacía con total 0", async () => {
    r.consultar.mockResolvedValue([]);
    r.contar.mockResolvedValue(0);
    expect(await consultarHistorico({ sensorId: "s-sin-lecturas", pagina: 1 })).toEqual({
      items: [],
      pagina: 1,
      tamano: 25,
      total: 0,
    });
  });
});
