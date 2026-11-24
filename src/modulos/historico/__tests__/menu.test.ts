import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";
import { menu } from "../menu";

describe("menú del histórico", () => {
  it("#26 CA-1: el ítem es «Histórico» a /historico con orden 15 para ambos roles", () => {
    expect(menu).toMatchObject({ etiqueta: "Histórico", href: "/historico", orden: 15 });
    expect(menu.roles).toEqual(expect.arrayContaining(["administrador", "tecnico"]));
  });

  it("#26 CA-1: el menú del administrador incluye Histórico", () => {
    expect(registro.menuPara("administrador")).toContainEqual(
      expect.objectContaining({ etiqueta: "Histórico", href: "/historico" }),
    );
  });

  it("#26 CA-1: el menú del técnico incluye Histórico", () => {
    expect(registro.menuPara("tecnico")).toContainEqual(
      expect.objectContaining({ etiqueta: "Histórico", href: "/historico" }),
    );
  });
});
