import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Notificacion, RespuestaNotificaciones } from "../schema";
import { ListaNotificaciones } from "../ui/ListaNotificaciones";

const notif = (id: string, extra: Partial<Notificacion>): Notificacion => ({
  id,
  sensor: "Sensor de tensión S1",
  magnitud: "voltaje",
  valor: 128.9,
  fecha: "2026-11-22T15:00:00.000Z",
  leida: false,
  ...extra,
});

const respuesta: RespuestaNotificaciones = {
  notificaciones: [
    notif("a", { sensor: "Sensor de tensión S1", magnitud: "voltaje", valor: 128.9, leida: false }),
    notif("b", { sensor: "Sensor de potencia S3", magnitud: "potencia", valor: 2150, leida: false, fecha: "2026-11-22T14:00:00.000Z" }),
    notif("c", { sensor: "Sensor de corriente S2", magnitud: "corriente", valor: 17.2, leida: true, fecha: "2026-11-22T13:00:00.000Z" }),
  ],
  noLeidas: 2,
};
const html = (props: RespuestaNotificaciones = respuesta) => renderToStaticMarkup(createElement(ListaNotificaciones, props));
const filas = (h: string) => h.split('data-testid="notificacion"').slice(1);

describe("lista de notificaciones", () => {
  it("#24 CA-1: muestra sensor, magnitud, valor y fecha de cada notificación", () => {
    const [a, b, c] = filas(html());
    expect(a).toContain("Sensor de tensión S1");
    expect(a).toContain("128,9 V");
    expect(b).toContain("Sensor de potencia S3");
    expect(b).toContain("2,15 kW");
    expect(c).toContain("Sensor de corriente S2");
    expect(c).toContain("17,2 A");
    expect(html()).toMatch(/<time[^>]*dateTime="2026-11-22T15:00:00.000Z"/);
    expect(html()).toMatch(/voltaje/i);
    expect(html()).toMatch(/corriente/i);
    expect(html()).toMatch(/potencia/i);
  });

  it("#24 CA-1: respeta el orden recibido", () => {
    const orden = filas(html()).map((f) => f.match(/Sensor de [\p{L}]+ S\d/u)![0]);
    expect(orden).toEqual(["Sensor de tensión S1", "Sensor de potencia S3", "Sensor de corriente S2"]);
  });

  it("#24 CA-1: la no leída lleva el texto «No leída» además del color", () => {
    const [a, , c] = filas(html());
    expect(a).toContain('data-leida="false"');
    expect(a).toContain("No leída");
    expect(c).toContain('data-leida="true"');
    expect(c).not.toContain("No leída");
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
