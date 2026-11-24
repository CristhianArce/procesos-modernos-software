import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("menú de notificaciones", () => {
  it("#24 CA-1: el menú del técnico incluye Notificaciones", () => {
    expect(registro.menuPara("tecnico")).toContainEqual(
      expect.objectContaining({ etiqueta: "Notificaciones", href: "/notificaciones" }),
    );
  });

  it("#24 CA-3: el menú del administrador no incluye Notificaciones", () => {
    const menuAdmin = registro.menuPara("administrador");
    expect(menuAdmin.length).toBeGreaterThan(0);
    expect(menuAdmin.map((i) => i.etiqueta)).not.toContain("Notificaciones");
  });
});
