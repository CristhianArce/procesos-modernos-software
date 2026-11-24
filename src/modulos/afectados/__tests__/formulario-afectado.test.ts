import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormularioAfectado } from "../ui/FormularioAfectado";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// El envío y la ficha actualizada se prueban con Playwright (e2e/afectados.spec.ts).
describe("formulario de afectado", () => {
  const html = renderToStaticMarkup(createElement(FormularioAfectado, { nodoId: "00000000-0000-4000-8000-000000000001" }));

  it("#54 CA-2: muestra el campo Alias con maxLength 100 y el botón para agregar", () => {
    expect(html).toMatch(/<input[^>]*name="alias"[^>]*>/);
    expect(html).toMatch(/<input[^>]*maxLength="100"[^>]*>/);
    expect(html).toContain("Alias");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Agregar afectado<\/button>/);
  });

  it("#54 CA-2: en reposo no muestra ningún error", () => {
    expect(html).not.toContain('role="alert"');
  });
});
