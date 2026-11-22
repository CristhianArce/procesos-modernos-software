import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Lectura } from "@/modulos/lecturas/repo";
import { TarjetaSensor } from "../ui/TarjetaSensor";

const lectura = (id: string, voltaje: number, tomadaEn: string): Lectura => ({
  id,
  sensorId: "s1",
  voltaje,
  corriente: 9.8,
  potencia: 1179.92,
  tomadaEn,
});

const render = (lecturas: Lectura[]) => renderToStaticMarkup(createElement(TarjetaSensor, { nombre: "Transformador principal", lecturas }));

describe("tarjeta de un sensor", () => {
  it("#22 CA-1: muestra la última lectura con V, A, W y la fecha", () => {
    const html = render([lectura("l1", 118, "2026-11-22T15:00:00Z"), lectura("l2", 120.4, "2026-11-22T15:30:05Z")]);
    expect(html).toContain("Transformador principal");
    expect(html).toMatch(/data-testid="ultima-lectura"[^>]*>120\.4 V · 9\.8 A · 1179\.92 W · [^<]*10:30:05/);
  });

  it("#22 CA-2: dibuja una gráfica por magnitud, cada una con su título", () => {
    const html = render([lectura("l1", 120, "2026-11-22T15:00:00Z")]);
    for (const titulo of ["Voltaje (V)", "Corriente (A)", "Potencia (W)"]) expect(html).toContain(`>${titulo}</figcaption>`);
  });

  it("#22 CA-1: un sensor sin lecturas muestra Sin lecturas y ninguna gráfica", () => {
    const html = render([]);
    expect(html).toContain("Sin lecturas");
    expect(html).not.toContain("figcaption");
  });
});
