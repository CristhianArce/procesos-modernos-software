import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormularioSensor } from "../ui/FormularioSensor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// El envío y la ficha actualizada se prueban con Playwright (e2e/nodos.spec.ts).
describe("formulario de sensor", () => {
  const html = renderToStaticMarkup(createElement(FormularioSensor, { nodoId: "00000000-0000-4000-8000-000000000001" }));

  it("#21 CA-2: muestra el nombre, un umbral por magnitud y el botón para agregar", () => {
    expect(html).toMatch(/<input[^>]*name="nombre"[^>]*>/);
    for (const campo of ["umbralVoltaje", "umbralCorriente", "umbralPotencia"]) {
      expect(html).toMatch(new RegExp(`<input[^>]*name="${campo}"[^>]*type="number"|<input[^>]*type="number"[^>]*name="${campo}"`));
    }
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Agregar sensor<\/button>/);
    expect(html).not.toContain('role="alert"');
  });
});
