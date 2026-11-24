import { sesionActual } from "@/lib/dal";
import { consultarNotificaciones } from "@/modulos/notificaciones/service";
import { ListaNotificaciones } from "@/modulos/notificaciones/ui/ListaNotificaciones";
import { EstadoError } from "@/modulos/ui/EstadoError";

export const dynamic = "force-dynamic";

// La lista se actualiza al recargar o navegar (RN-6). Ocultar la entrada del menú al administrador es cosmético:
// aquí y en la API se comprueba el rol (RN-4).
export default async function PaginaNotificaciones() {
  const sesion = await sesionActual();
  if (sesion?.rol !== "tecnico") {
    return <EstadoError titulo="El centro de notificaciones es solo para técnicos" detalle="Inicia sesión con una cuenta de técnico." />;
  }
  const { notificaciones, noLeidas } = await consultarNotificaciones(sesion.sub);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Notificaciones</h1>
        <p className="subtitulo-pagina">Avisos pendientes de atender, del más reciente al más antiguo.</p>
      </header>
      <ListaNotificaciones notificaciones={notificaciones} noLeidas={noLeidas} />
    </div>
  );
}
