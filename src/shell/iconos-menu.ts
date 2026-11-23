import type { NombreIcono } from "@/modulos/ui/Icono";

// El contrato de menu.ts no lleva icono (decisión #12 del plan): el shell lo elige por ruta y usa uno genérico para el resto.
const POR_RUTA: Record<string, NombreIcono> = { "/": "inicio", "/dashboard": "dashboard", "/nodos": "nodos" };

export const iconoDeRuta = (href: string): NombreIcono => POR_RUTA[href] ?? "generico";
