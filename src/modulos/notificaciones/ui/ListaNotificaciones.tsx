import { formatearFecha, UNIDAD } from "@/modulos/dashboard/formato";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { cifraConUnidad } from "@/modulos/ui/formato";
import { Insignia } from "@/modulos/ui/Insignia";
import { Tarjeta } from "@/modulos/ui/Tarjeta";
import type { CentroNotificaciones } from "../service";
import { BotonMarcarLeida } from "./BotonMarcarLeida";

/** Centro de notificaciones del técnico: contador de no leídas y la lista, la más reciente primero (CA-1). */
export function ListaNotificaciones({ noLeidas, notificaciones }: CentroNotificaciones) {
  return (
    <Tarjeta
      titulo="Tus notificaciones"
      acciones={
        <p data-testid="no-leidas" className="cifra text-sm text-texto">
          {noLeidas} sin leer
        </p>
      }
    >
      {notificaciones.length === 0 ? (
        <div data-testid="sin-notificaciones">
          <EstadoVacio titulo="No tienes notificaciones" icono="alarma">
            Cuando una alerta te avise, aparecerá aquí.
          </EstadoVacio>
        </div>
      ) : (
        <ul className="divide-y divide-borde">
          {notificaciones.map((n) => (
            <li key={n.id} data-testid="notificacion" className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <p className="text-sm text-texto">
                <strong className="font-semibold">{n.sensor}</strong> · {n.magnitud} ·{" "}
                <span className="cifra">{cifraConUnidad(n.valor, UNIDAD[n.magnitud])}</span> ·{" "}
                <span className="cifra text-tenue">{formatearFecha(n.creadaEn)}</span>
              </p>
              <div className="flex items-center gap-2">
                <Insignia tono={n.leida ? "neutro" : "acento"}>{n.leida ? "Leída" : "Sin leer"}</Insignia>
                {!n.leida && <BotonMarcarLeida id={n.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
