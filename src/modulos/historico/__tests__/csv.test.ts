import { describe, expect, it } from "vitest";
import { aCsv, celdaCsv, ENCABEZADO_CSV } from "../csv";
import type { LecturaHistorico } from "../repo";

const lectura = (p: Partial<LecturaHistorico> = {}): LecturaHistorico => ({
  id: "l1",
  nodoId: "n1",
  nodoNombre: "Nodo histórico demo",
  sensorId: "s1",
  sensorNombre: "Medidor histórico A",
  voltaje: 122.6,
  corriente: 5,
  potencia: 600,
  tomadaEn: "2026-01-12T15:00:00.000Z",
  ...p,
});

describe("serializador CSV", () => {
  it("#56 CA-1: la primera línea es el encabezado nodo,sensor,voltaje,corriente,potencia,fecha", () => {
    expect(ENCABEZADO_CSV).toBe("nodo,sensor,voltaje,corriente,potencia,fecha");
    expect(aCsv([lectura()]).split("\r\n")[0]).toBe("nodo,sensor,voltaje,corriente,potencia,fecha");
  });

  it("#56 CA-1: cada fila trae nodo, sensor, voltaje, corriente, potencia y fecha ISO UTC en ese orden", () => {
    const lineas = aCsv([lectura()]).split("\r\n");
    expect(lineas[1]).toBe("Nodo histórico demo,Medidor histórico A,122.6,5,600,2026-01-12T15:00:00.000Z");
  });

  it("#56 CA-1: una fila por lectura, en el orden recibido, y las líneas terminan en \\r\\n", () => {
    const csv = aCsv([
      lectura({ voltaje: 122.6, tomadaEn: "2026-01-12T15:00:00.000Z" }),
      lectura({ voltaje: 119, tomadaEn: "2026-01-12T13:00:00.000Z" }),
    ]);
    expect(csv).toBe(
      "nodo,sensor,voltaje,corriente,potencia,fecha\r\n" +
        "Nodo histórico demo,Medidor histórico A,122.6,5,600,2026-01-12T15:00:00.000Z\r\n" +
        "Nodo histórico demo,Medidor histórico A,119,5,600,2026-01-12T13:00:00.000Z\r\n",
    );
  });

  it("#56 CA-2: sin lecturas el archivo es solo el encabezado", () => {
    expect(aCsv([])).toBe("nodo,sensor,voltaje,corriente,potencia,fecha\r\n");
  });

  it("#56 CA-1: un valor que empieza por =, +, - o @ sale con apóstrofo delante", () => {
    expect(celdaCsv("=SUMA(A1)")).toBe("'=SUMA(A1)");
    expect(celdaCsv("+1")).toBe("'+1");
    expect(celdaCsv("-2")).toBe("'-2");
    expect(celdaCsv("@cmd")).toBe("'@cmd");
    expect(celdaCsv("Sensor normal")).toBe("Sensor normal");
  });

  it("#56 CA-1: el nombre de sensor que empieza por = lleva ' y la fila conserva seis columnas", () => {
    const linea = aCsv([lectura({ sensorNombre: "=1+1" })]).split("\r\n")[1];
    expect(linea).toBe("Nodo histórico demo,'=1+1,122.6,5,600,2026-01-12T15:00:00.000Z");
    expect(linea.split(",")).toHaveLength(6);
  });

  it("#56 CA-1: un nombre con coma va entre comillas dobles y la fila sigue con seis columnas", () => {
    const linea = aCsv([lectura({ nodoNombre: "Nodo A, planta 2" })]).split("\r\n")[1];
    expect(linea).toBe('"Nodo A, planta 2",Medidor histórico A,122.6,5,600,2026-01-12T15:00:00.000Z');
    expect(linea.replace(/"[^"]*"/g, "x").split(",")).toHaveLength(6);
  });

  it("#56 CA-1: un nombre con comillas va entre comillas con las comillas duplicadas", () => {
    expect(celdaCsv('Nodo "norte"')).toBe('"Nodo ""norte"""');
    const linea = aCsv([lectura({ nodoNombre: 'Nodo "norte"' })]).split("\r\n")[1];
    expect(linea.startsWith('"Nodo ""norte""",Medidor histórico A,')).toBe(true);
  });

  it("#56 CA-1: un valor con salto de línea va entre comillas dobles", () => {
    expect(celdaCsv("a\nb")).toBe('"a\nb"');
  });
});
