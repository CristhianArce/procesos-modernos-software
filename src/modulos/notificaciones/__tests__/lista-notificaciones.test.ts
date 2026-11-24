import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Notificacion, RespuestaNotificaciones } from "../schema";
import { ListaNotificaciones } from "../ui/ListaNotificaciones";

const notificacion = (id: string, extra: Partial<Notificacion> = {}): Notificacion => ({
  id,
  sensor: "Sensor de tensión S1",
  magnitud: "voltaje",
  valor: 128.9,
  fecha: "2026-11-23T10:00:00.000Z",
  leida: false,
  ...extra,
});

const datos: RespuestaNotificaciones = {
  notificaciones: [
    notificacion("a", { sensor: "Sensor uno", magnitud: "voltaje", valor: 128.9 }),
    notificacion("b", { sensor: "Sensor dos", magnitud: "potencia", valor: 2150, leida: true }),
    notificacion("c", { sensor: "Sensor tres", magnitud: "corriente", valor: 17.2 }),
  ],
  noLeidas: 2,
};
const html = (props = datos) => renderToStaticMarkup(createElement(ListaNotificaciones, props));
const fila = (h: string, sensor: string) => h.split('data-testid="notificacion"').find((t) => t.includes(sensor)) ?? "";

describe("lista de notificaciones", () => {
  it("#24 CA-1: muestra sensor, magnitud, valor y fecha de cada notificación", () => {
    const h = html();
    expect(fila(h, "Sensor uno")).toContain("128,9 V");
    expect(fila(h, "Sensor dos")).toContain("2,15 kW");
    expect(fila(h, "Sensor tres")).toContain("17,2 A");
    expect(fila(h, "Sensor uno")).toMatch(/voltaje/i);
    expect(fila(h, "Sensor dos")).toMatch(/potencia/i);
    expect(fila(h, "Sensor tres")).toMatch(/corriente/i);
    expect(h).toContain("cifra");
    expect(fila(h, "Sensor uno")).toMatch(/2026|23/);
  });

  it("#24 CA-1: no muestra umbral ni nodo", () => {
    expect(html()).not.toMatch(/umbral|nodo/i);
  });

  it("#24 CA-1: respeta el orden recibido", () => {
    const h = html();
    expect(h.indexOf("Sensor uno")).toBeLessThan(h.indexOf("Sensor dos"));
    expect(h.indexOf("Sensor dos")).toBeLessThan(h.indexOf("Sensor tres"));
    expect(h.match(/data-testid="notificacion"/g)).toHaveLength(3);
  });

  it("#24 CA-1: la no leída lleva el texto «No leída» además del color", () => {
    const h = html();
    expect(fila(h, "Sensor uno")).toContain("No leída");
    expect(fila(h, "Sensor uno")).toContain('data-leida="false"');
    expect(fila(h, "Sensor dos")).not.toContain("No leída");
    expect(fila(h, "Sensor dos")).toContain('data-leida="true"');
  });

  it("#24 CA-1: muestra el número de no leídas", () => {
    expect(html()).toMatch(/data-testid="no-leidas"[^>]*>No leídas: 2</);
  });

  it("#24 CA-1: muestra el estado vacío sin notificaciones", () => {
    const h = html({ notificaciones: [], noLeidas: 0 });
    expect(h).toContain("No tienes notificaciones");
    expect(h).not.toContain('data-testid="notificacion"');
  });
});
