import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("menú del dashboard", () => {
  it("#22 CA-1: el menú ofrece Dashboard al administrador y al técnico", () => {
    for (const rol of ["administrador", "tecnico"] as const) {
      expect(registro.menuPara(rol)).toContainEqual(expect.objectContaining({ etiqueta: "Dashboard", href: "/dashboard" }));
    }
  });
});
