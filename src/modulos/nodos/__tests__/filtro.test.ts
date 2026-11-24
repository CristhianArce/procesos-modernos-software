import { describe, expect, it } from "vitest";
import { filtrarNodos } from "../filtro";

const nodos = [
  { nombre: "Subestación Norte", ubicacion: "Bello, Antioquia" },
  { nombre: "Subestación Sur", ubicacion: "Envigado, Antioquia" },
  { nombre: "Alimentador Itagüí", ubicacion: null },
];

describe("búsqueda de nodos", () => {
  it("ui-scada: busca por nombre o ubicación sin importar mayúsculas ni tildes", () => {
    expect(filtrarNodos(nodos, "subestacion").map((n) => n.nombre)).toEqual(["Subestación Norte", "Subestación Sur"]);
    expect(filtrarNodos(nodos, "ENVIGADO").map((n) => n.nombre)).toEqual(["Subestación Sur"]);
    expect(filtrarNodos(nodos, "itagui").map((n) => n.nombre)).toEqual(["Alimentador Itagüí"]);
  });

  it("ui-scada: un texto vacío o de solo espacios devuelve todos", () => {
    expect(filtrarNodos(nodos, "  ")).toHaveLength(3);
  });
});
