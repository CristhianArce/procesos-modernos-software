import { describe, expect, it } from "vitest";
import { registro } from "@/nav/registro";

describe("menú de notificaciones", () => {
  it("#24 CA-1: la entrada Notificaciones es solo para el técnico", () => {
    const entrada = expect.objectContaining({ etiqueta: "Notificaciones", href: "/notificaciones" });
    expect(registro.menuPara("tecnico")).toContainEqual(entrada);
    expect(registro.menuPara("administrador")).not.toContainEqual(entrada);
  });
});
