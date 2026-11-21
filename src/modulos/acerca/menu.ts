import type { Rol } from "./handler";

export type ItemMenu = { etiqueta: string; ruta: string; roles: readonly Rol[] };

export const itemMenuAcerca: ItemMenu = {
  etiqueta: "Acerca de",
  ruta: "/acerca",
  roles: ["administrador", "tecnico"],
};
