import Link from "next/link";
import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/dal";
import { registro } from "@/nav/registro";

// Núcleo: ninguna historia edita este layout. El menú sale de los menu.ts de cada módulo.
export default async function LayoutTablero({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login"); // proxy.ts ya redirige; esto cubre una cookie que vence entre ambos

  return (
    <div className="flex flex-1">
      <nav aria-label="Menú principal" className="w-56 shrink-0 border-r border-borde p-4">
        <ul className="space-y-2">
          {registro.menuPara(sesion.rol).map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:underline">
                {item.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
