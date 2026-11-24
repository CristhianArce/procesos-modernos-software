import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListaNotificaciones } from "../ui/ListaNotificaciones";
import type { Notificacion } from "../tipos";

const notificacion = (id: string, extra: Partial<Notificacion>): Notificacion => ({
  id,
  sensor: "Sensor X",
  magnitud: "voltaje",
  valor: 130,
  fecha: "2026-11-22T15:00:00.000Z",
  leida: false,
  ...extra,
});

const lista = [
  notificacion("a", { sensor: "Transformador principal", magnitud: "voltaje", valor: 130.5, leida: false }),
  notificacion("b", { sensor: "Acometida hospital", magnitud: "corriente", valor: 18.25, leida: true, fecha: "2026-11-21T10:00:00.000Z" }),
  notificacion("c", { sensor: "Generador auxiliar", magnitud: "potencia", valor: 500, leida: false, fecha: "2026-11-20T10:00:00.000Z" }),
];

const html = (notificaciones = lista, noLeidas = 2) =>
  renderToStaticMarkup(createElement(ListaNotificaciones, { notificaciones, noLeidas }));

describe("lista de notificaciones", () => {
  it("#24 CA-1: lista las notificaciones en el orden recibido con el número de no leídas", () => {
    const h = html();
    expect(h.match(/data-testid="notificacion"/g)).toHaveLength(3);
    const posiciones = ["Transformador principal", "Acometida hospital", "Generador auxiliar"].map((s) => h.indexOf(s));
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    expect([...posiciones].sort((x, y) => x - y)).toEqual(posiciones);
    expect(h).toMatch(/data-testid="no-leidas"[^>]*>\s*2\s*</);
    expect(h).toContain("sin leer");
  });

  it("#24 CA-1: sin notificaciones muestra el estado vacío y 0", () => {
    const h = html([], 0);
    expect(h).toContain('data-testid="notificaciones-vacio"');
    expect(h).not.toContain('data-testid="notificacion"');
    expect(h).toMatch(/data-testid="no-leidas"[^>]*>\s*0\s*</);
  });

  it("#24 CA-1: cada notificación muestra sensor, magnitud, valor con unidad, fecha y si está leída", () => {
    const h = html();
    expect(h).toContain("Transformador principal");
    expect(h).toMatch(/voltaje/i);
    expect(h).toContain("130,5 V");
    expect(h).toContain("18,25 A");
    expect(h).toContain("500 W");
    expect(h).toMatch(/2026/);
    expect(h).toContain("Sin leer");
    expect(h).toContain("Leída");
  });
});
