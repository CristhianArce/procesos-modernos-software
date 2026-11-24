import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("menú del histórico", () => {
  it("#26 CA-1: el menú ofrece Histórico al administrador y al técnico", () => {
    for (const rol of ["administrador", "tecnico"] as const) {
      expect(registro.menuPara(rol)).toContainEqual(expect.objectContaining({ etiqueta: "Histórico", href: "/historico" }));
    }
  });
});
