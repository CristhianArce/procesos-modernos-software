import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/dal";
import { logger } from "@/lib/logger";
import { consultar } from "@/modulos/notificaciones/service";
import { ListaNotificaciones } from "@/modulos/notificaciones/ui/ListaNotificaciones";
import { EstadoError } from "@/modulos/ui/EstadoError";

export const dynamic = "force-dynamic";

export default async function PaginaNotificaciones() {
  const sesion = await sesionActual();
  if (sesion?.rol !== "tecnico") redirect("/"); // solo técnicos (decisión #4); sin sesión ya redirige proxy.ts

  const datos = await consultar(sesion.sub).catch((err) => {
    logger.error({ err }, "no se pudieron cargar las notificaciones");
    return null;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Notificaciones</h1>
        <p className="subtitulo-pagina">Avisos de alertas que tienes pendientes de atender.</p>
      </header>
      {datos ? <ListaNotificaciones {...datos} /> : <EstadoError detalle="No se pudieron cargar tus notificaciones. Recarga la página." />}
    </div>
  );
}
