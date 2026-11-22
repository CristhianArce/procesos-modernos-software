import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Alerta } from "@/modulos/alertas/repo";
import { ListaAlertas } from "../ui/ListaAlertas";

const alerta = (id: string, valor: number, creadaEn: string): Alerta => ({ id, sensorId: "s1", magnitud: "voltaje", valor, umbral: 125, creadaEn });
const nombres = new Map([["s1", "Transformador principal"]]);
const render = (alertas: Alerta[]) => renderToStaticMarkup(createElement(ListaAlertas, { alertas, nombres }));

describe("lista de alertas", () => {
  it("#22 CA-4: lista las alertas en el orden recibido, la más reciente primero, con sensor, magnitud, valor y umbral", () => {
    const html = render([alerta("a2", 131, "2026-11-22T16:00:00Z"), alerta("a1", 130, "2026-11-22T15:00:00Z")]);
    expect(html.indexOf("131 V")).toBeLessThan(html.indexOf("130 V"));
    expect(html).toContain("Transformador principal");
    expect(html).toContain(">voltaje<");
    expect(html).toContain("125 V");
    expect(html).toContain("11:00:00");
  });

  it("#22 CA-4: sin alertas muestra Sin alertas", () => {
    expect(render([])).toContain("Sin alertas");
  });
});
