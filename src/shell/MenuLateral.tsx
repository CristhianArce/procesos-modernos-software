"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icono } from "@/modulos/ui/Icono";
import { iconoDeRuta } from "./iconos-menu";
import { COOKIE_MENU } from "./preferencias";

type Item = { etiqueta: string; href: string };

const activo = (ruta: string, href: string) => (href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`));

/** Menú lateral con iconos. Plegado se guarda en una cookie para que el servidor lo pinte igual (sin parpadeo). */
export function MenuLateral({ items, plegadoInicial }: { items: Item[]; plegadoInicial: boolean }) {
  const ruta = usePathname();
  const [plegado, setPlegado] = useState(plegadoInicial);

  function alternar() {
    const nuevo = !plegado;
    setPlegado(nuevo);
    document.cookie = `${COOKIE_MENU}=${nuevo ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <nav
      aria-label="Menú principal"
      data-plegado={plegado}
      className="group/menu flex w-56 flex-col border-r border-borde bg-fondo-2/60 py-3 transition-[width] duration-200 data-[plegado=true]:w-16 max-lg:w-16"
    >
      <ul className="flex flex-col gap-1 px-2">
        {items.map((item) => {
          const esActivo = activo(ruta, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={esActivo ? "page" : undefined}
                title={item.etiqueta}
                className="relative flex h-10 items-center gap-3 rounded-sc px-3 text-sm text-tenue hover:bg-panel hover:text-texto aria-[current=page]:bg-panel aria-[current=page]:text-texto aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:left-0 aria-[current=page]:before:w-0.5 aria-[current=page]:before:rounded aria-[current=page]:before:bg-acento"
              >
                <Icono nombre={iconoDeRuta(item.href)} className={esActivo ? "text-acento" : ""} />
                <span className="truncate group-data-[plegado=true]/menu:sr-only max-lg:sr-only">{item.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={!plegado}
        aria-label={plegado ? "Desplegar menú" : "Plegar menú"}
        className="boton-fantasma mx-auto mt-auto max-lg:hidden"
      >
        <Icono nombre={plegado ? "desplegar" : "plegar"} tamano={18} />
      </button>
    </nav>
  );
}
