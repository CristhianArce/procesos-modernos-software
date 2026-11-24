import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/dal";
import { consultarNotificaciones } from "@/modulos/notificaciones/service";
import { ListaNotificaciones } from "@/modulos/notificaciones/ui/ListaNotificaciones";

export const dynamic = "force-dynamic";

// Solo técnicos (RN-4). Se actualiza al recargar o navegar (RN-6); un fallo lo cubre (tablero)/error.tsx.
export default async function PaginaNotificaciones() {
  const sesion = await sesionActual();
  if (sesion?.rol !== "tecnico") redirect("/");
  const centro = await consultarNotificaciones(sesion.sub);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Notificaciones</h1>
        <p className="subtitulo-pagina">Avisos de alertas que tienes pendientes de atender.</p>
      </header>
      <ListaNotificaciones {...centro} />
    </div>
  );
}
