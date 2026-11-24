import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BotonMarcarLeida } from "../ui/BotonMarcarLeida";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const html = () => renderToStaticMarkup(createElement(BotonMarcarLeida, { id: "n1" }));

describe("BotonMarcarLeida", () => {
  it("#53 CA-1: muestra un button con type, data-testid y el texto", () => {
    const marcado = html();
    expect(marcado).toMatch(/<button[^>]*type="button"/);
    expect(marcado).toContain('data-testid="marcar-leida"');
    expect(marcado).toContain("Marcar como leída");
  });

  it("#53 CA-1: sin error no hay alerta", () => {
    const marcado = html();
    expect(marcado).toContain("Marcar como leída");
    expect(marcado).not.toContain('role="alert"');
  });
});
