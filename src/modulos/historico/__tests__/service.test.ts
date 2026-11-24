import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "../repo";
import { consultarHistorico } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const fila = (id: string): repo.LecturaHistorico => ({
  id,
  sensorId: "s1",
  sensorNombre: "Sensor 1",
  nodoId: "n1",
  nodoNombre: "Nodo 1",
  voltaje: 120,
  corriente: 10,
  potencia: 1200,
  tomadaEn: "2026-03-10T00:00:00.000Z",
});

beforeEach(() => vi.resetAllMocks());

describe("servicio del histórico", () => {
  it("#26 CA-1: devuelve items, pagina, porPagina 25 y total con lo que da el repo", async () => {
    r.listar.mockResolvedValue([fila("l1"), fila("l2")]);
    r.contar.mockResolvedValue(26);
    const consulta = { pagina: 1, nodoId: "n1" };
    expect(await consultarHistorico(consulta)).toEqual({ items: [fila("l1"), fila("l2")], pagina: 1, porPagina: 25, total: 26 });
    expect(r.listar).toHaveBeenCalledWith(consulta);
    expect(r.contar).toHaveBeenCalled();
  });

  it("#26 CA-3: una página más allá del final devuelve items vacío con el total real", async () => {
    r.listar.mockResolvedValue([]);
    r.contar.mockResolvedValue(26);
    expect(await consultarHistorico({ pagina: 9 })).toEqual({ items: [], pagina: 9, porPagina: 25, total: 26 });
  });

  it("#26 CA-3: sin coincidencias devuelve lista vacía y total 0", async () => {
    r.listar.mockResolvedValue([]);
    r.contar.mockResolvedValue(0);
    expect(await consultarHistorico({ pagina: 1, sensorId: "x" })).toEqual({ items: [], pagina: 1, porPagina: 25, total: 0 });
  });
});
