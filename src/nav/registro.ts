import type { ReactNode } from "react";
import type { Rol } from "@/lib/session";

/** `src/modulos/<modulo>/menu.ts` exporta `menu`. */
export type ItemMenu = { etiqueta: string; href: string; roles: readonly Rol[]; orden: number };

/** `src/modulos/<modulo>/paneles.ts` exporta `paneles`: se muestran en la ficha del nodo (HU 4). */
export type Panel = {
  titulo: string;
  orden: number;
  Componente: (props: { nodoId: string }) => ReactNode | Promise<ReactNode>;
};

/** `src/modulos/<modulo>/on-alerta.ts` exporta `onAlerta`: el servicio de alertas (HU 5) lo llama al registrar una. */
export type SuscriptorAlerta = {
  // Método (no propiedad) para que cada módulo tipe la alerta con el tipo que define la HU 5.
  manejar(alerta: unknown): void | Promise<void>;
};

export type ExtensionesModulo = { menu?: ItemMenu; paneles?: Panel[]; onAlerta?: SuscriptorAlerta };

/** Función pura: arma el registro a partir de las extensiones de cada módulo (decisión #3). */
export function construirRegistro(modulos: Record<string, ExtensionesModulo>) {
  const nombres = Object.keys(modulos).sort();
  const porOrden = <T extends { orden: number }>(a: T, b: T) => a.orden - b.orden;
  const menu = nombres.flatMap((n) => modulos[n].menu ?? []).sort(porOrden);
  const paneles = nombres.flatMap((n) => modulos[n].paneles ?? []).sort(porOrden);
  const suscriptores = nombres.flatMap((n) => {
    const s = modulos[n].onAlerta;
    return s ? [{ modulo: n, ...s }] : [];
  });
  return {
    menu,
    paneles,
    suscriptores,
    /** Ocultar el ítem es cosmético: cada handler verifica el rol con requireRole. */
    menuPara: (rol: Rol) => menu.filter((i) => i.roles.includes(rol)),
  };
}

// Descubrimiento con import.meta.glob (Turbopack y Vitest): agregar un módulo no edita este archivo.
const globs = {
  menu: import.meta.glob<{ menu: ItemMenu }>("../modulos/*/menu.ts", { eager: true }),
  paneles: import.meta.glob<{ paneles: Panel[] }>("../modulos/*/paneles.ts", { eager: true }),
  onAlerta: import.meta.glob<{ onAlerta: SuscriptorAlerta }>("../modulos/*/on-alerta.ts", { eager: true }),
};

const nombreModulo = (ruta: string) => ruta.split("/")[2]; // "../modulos/<modulo>/menu.ts"

function descubrir(): Record<string, ExtensionesModulo> {
  const modulos: Record<string, ExtensionesModulo> = {};
  const de = (ruta: string) => (modulos[nombreModulo(ruta)] ??= {});
  for (const [ruta, m] of Object.entries(globs.menu)) de(ruta).menu = m.menu;
  for (const [ruta, m] of Object.entries(globs.paneles)) de(ruta).paneles = m.paneles;
  for (const [ruta, m] of Object.entries(globs.onAlerta)) de(ruta).onAlerta = m.onAlerta;
  return modulos;
}

export const registro = construirRegistro(descubrir());
