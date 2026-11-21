import { describe, expect, it } from "vitest";
import { itemMenuAcerca } from "../menu";

describe("menú acerca", () => {
  it("#6 CA-2: el técnico ve el ítem Acerca de que lleva a /acerca", () => {
    expect(itemMenuAcerca.etiqueta).toBe("Acerca de");
    expect(itemMenuAcerca.ruta).toBe("/acerca");
    expect(itemMenuAcerca.roles).toContain("tecnico");
  });
});
