import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";
import { menu } from "../menu";

describe("menú del histórico", () => {
  it("#26 CA-1: el ítem es Histórico hacia /historico para ambos roles", () => {
    expect(menu).toEqual(
      expect.objectContaining({ etiqueta: "Histórico", href: "/historico", roles: ["administrador", "tecnico"] }),
    );
  });

  it("#26 CA-1: el registro de menú ofrece Histórico al administrador y al técnico", () => {
    for (const rol of ["administrador", "tecnico"] as const) {
      expect(registro.menuPara(rol)).toContainEqual(expect.objectContaining({ etiqueta: "Histórico", href: "/historico" }));
    }
  });
});
