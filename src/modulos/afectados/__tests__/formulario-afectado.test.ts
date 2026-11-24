import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormularioAfectado } from "../ui/FormularioAfectado";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const nodoId = "00000000-0000-4000-8000-000000000003";
const html = () => renderToStaticMarkup(createElement(FormularioAfectado, { nodoId }));

describe("FormularioAfectado", () => {
  it("#54 CA-1: trae el formulario con su data-testid", () => {
    expect(html()).toContain('data-testid="formulario-afectado"');
  });

  it("#54 CA-1: trae el campo Alias obligatorio con maxLength 80", () => {
    const salida = html();
    expect(salida).toContain("Alias");
    expect(salida).toMatch(/<input[^>]*name="alias"/);
    expect(salida).toMatch(/<input[^>]*maxLength="80"/);
    expect(salida).toMatch(/<input[^>]*required/);
  });

  it("#54 CA-1: trae el botón Agregar afectado habilitado y sin alerta de error", () => {
    const salida = html();
    expect(salida).toMatch(/<button[^>]*>\s*Agregar afectado\s*<\/button>/);
    expect(salida).not.toMatch(/<button[^>]*disabled/);
    expect(salida).not.toContain('role="alert"');
  });
});
