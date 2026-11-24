import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TecnicoAsignado } from "../ui/TecnicoAsignado";

const render = (tecnico: { id: string; nombreUsuario: string } | null) => renderToStaticMarkup(createElement(TecnicoAsignado, { tecnico }));

describe("técnico asignado", () => {
  it("#27 CA-1: con técnico muestra Responsable y su nombre en data-testid", () => {
    const html = render({ id: "00000000-0000-4000-8000-0000000000aa", nombreUsuario: "tecnico" });
    expect(html).toContain("Responsable");
    expect(html).toMatch(/data-testid="tecnico-asignado"[^>]*>[^<]*tecnico/);
    expect(html).not.toContain("Sin técnico asignado");
  });

  it("#27 CA-1: sin técnico muestra Sin técnico asignado y no el data-testid", () => {
    const html = render(null);
    expect(html).toContain("Sin técnico asignado");
    expect(html).not.toContain('data-testid="tecnico-asignado"');
  });
});
