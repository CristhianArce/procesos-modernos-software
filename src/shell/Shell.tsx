import { cookies } from "next/headers";
import type { Rol } from "@/lib/session";
import { instantaneaViva } from "@/modulos/estado/service";
import { ProveedorEstadoVivo } from "@/modulos/estado/ui/EstadoVivo";
import { AvisosAlertas } from "./AvisosAlertas";
import { BarraSuperior } from "./BarraSuperior";
import { MenuLateral } from "./MenuLateral";
import { COOKIE_MENU } from "./preferencias";

type Props = { rol: Rol; items: { etiqueta: string; href: string }[]; children: React.ReactNode };

/**
 * Shell de la sala de control: barra superior, menú lateral, contenido y avisos. Vive fuera del layout (núcleo)
 * porque lee datos de módulos. La instantánea inicial evita esperar al primer sondeo.
 */
export async function Shell({ rol, items, children }: Props) {
  const [inicial, galletas] = await Promise.all([instantaneaViva(), cookies()]);
  return (
    <ProveedorEstadoVivo inicial={inicial}>
      <div className="grid h-dvh grid-cols-[auto_1fr] grid-rows-[auto_1fr]">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sc focus:bg-panel focus:px-3 focus:py-2"
        >
          Saltar al contenido
        </a>
        <BarraSuperior rol={rol} />
        <MenuLateral items={items} plegadoInicial={galletas.get(COOKIE_MENU)?.value === "1"} />
        <main id="contenido" className="min-w-0 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <AvisosAlertas />
    </ProveedorEstadoVivo>
  );
}
