import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/dal";
import { registro } from "@/nav/registro";
import { Shell } from "@/shell/Shell";

// Núcleo: ninguna historia edita este layout. El menú sale de los menu.ts de cada módulo y el shell visual vive en src/shell.
export default async function LayoutTablero({ children }: { children: React.ReactNode }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login"); // proxy.ts ya redirige; esto cubre una cookie que vence entre ambos

  const items = registro.menuPara(sesion.rol).map(({ etiqueta, href }) => ({ etiqueta, href }));
  return (
    <Shell rol={sesion.rol} items={items}>
      {children}
    </Shell>
  );
}
