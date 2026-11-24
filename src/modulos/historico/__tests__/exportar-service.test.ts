import { beforeEach, describe, expect, it, vi } from "vitest";
import { enlaceExportar, TOPE_EXPORTACION } from "../exportar";
import * as repo from "../repo";
import { exportarHistorico } from "../service";

vi.mock("../repo");

const r = vi.mocked(repo);
const lectura = (id: string, voltaje: number, tomadaEn: string): repo.LecturaHistorico => ({
  id,
  nodoId: "n1",
  nodoNombre: "Nodo histórico demo",
  sensorId: "s1",
  sensorNombre: "Medidor histórico A",
  voltaje,
  corriente: 5,
  potencia: 600,
  tomadaEn,
});

beforeEach(() => vi.resetAllMocks());

describe("exportar el histórico", () => {
  it("#56 CA-1: el tope es 10 000", () => {
    expect(TOPE_EXPORTACION).toBe(10_000);
  });

  it("#56 CA-1: llama al repo con los filtros y el tope y devuelve el CSV de esas lecturas", async () => {
    const filtros = { nodoId: "n1", sensorId: "s1", desde: "2026-01-10", hasta: "2026-01-12" };
    r.listarParaExportar.mockResolvedValue([
      lectura("l2", 122.6, "2026-01-12T15:00:00.000Z"),
      lectura("l1", 119, "2026-01-12T13:00:00.000Z"),
    ]);
    const csv = await exportarHistorico(filtros);
    expect(r.listarParaExportar).toHaveBeenCalledWith(filtros, 10_000);
    expect(csv).toBe(
      "nodo,sensor,voltaje,corriente,potencia,fecha\r\n" +
        "Nodo histórico demo,Medidor histórico A,122.6,5,600,2026-01-12T15:00:00.000Z\r\n" +
        "Nodo histórico demo,Medidor histórico A,119,5,600,2026-01-12T13:00:00.000Z\r\n",
    );
  });

  it("#56 CA-2: sin lecturas devuelve solo el encabezado", async () => {
    r.listarParaExportar.mockResolvedValue([]);
    expect(await exportarHistorico({ desde: "2030-01-01" })).toBe("nodo,sensor,voltaje,corriente,potencia,fecha\r\n");
  });

  it("#56 CA-1: enlaceExportar arma la ruta con los filtros presentes y sin pagina", () => {
    const filtros = { nodoId: "n1", sensorId: "s1", desde: "2026-01-10", hasta: "2026-01-12" };
    const enlace = enlaceExportar({ ...filtros, pagina: 3 } as typeof filtros);
    expect(enlace).toBe("/api/historico/exportar?nodoId=n1&sensorId=s1&desde=2026-01-10&hasta=2026-01-12");
    expect(enlace).not.toContain("pagina");
  });

  it("#56 CA-1: enlaceExportar omite los filtros ausentes y no lleva ? sin filtros", () => {
    expect(enlaceExportar({})).toBe("/api/historico/exportar");
    expect(enlaceExportar({ desde: "2026-01-10" })).toBe("/api/historico/exportar?desde=2026-01-10");
  });
});
