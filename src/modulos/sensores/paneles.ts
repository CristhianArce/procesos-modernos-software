import type { Panel } from "@/nav/registro";

// PanelSensores llega a la BD (módulo asíncrono). Si paneles.ts lo importara de forma estática, en el build de
// producción el glob eager de src/nav/registro.ts recibiría este módulo sin su export y el panel no se mostraría.
// Cargarlo bajo demanda mantiene paneles.ts síncrono.
const PanelSensores: Panel["Componente"] = async ({ nodoId }) => {
  const { PanelSensores: Componente } = await import("./ui/PanelSensores");
  return Componente({ nodoId });
};

export const paneles: Panel[] = [{ titulo: "Sensores", orden: 10, Componente: PanelSensores }];
