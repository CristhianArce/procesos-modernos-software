import type { Magnitud } from "@/modulos/alertas/magnitudes";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { Insignia } from "@/modulos/ui/Insignia";
import { Tarjeta } from "@/modulos/ui/Tarjeta";
import type { Notificacion, RespuestaNotificaciones } from "../schema";

const ETIQUETA: Record<Magnitud, string> = { voltaje: "Voltaje", corriente: "Corriente", potencia: "Potencia" };
const FORMATO: Record<Magnitud, (n: number) => string> = { voltaje: formatoTension, corriente: formatoCorriente, potencia: formatoPotencia };
const FECHA = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

function Fila({ n }: { n: Notificacion }) {
  return (
    <li data-testid="notificacion" data-leida={n.leida} className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="font-medium text-texto">{n.sensor}</p>
        <p className="text-sm text-tenue">
          {ETIQUETA[n.magnitud]}: <span className="cifra">{FORMATO[n.magnitud](n.valor)}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!n.leida && <Insignia tono="acento">● No leída</Insignia>}
        <time dateTime={n.fecha} className="text-sm text-tenue">
          {FECHA.format(new Date(n.fecha))}
        </time>
      </div>
    </li>
  );
}

/** El centro de notificaciones: la más reciente primero y el número de no leídas (CA-1). */
export function ListaNotificaciones({ notificaciones, noLeidas }: RespuestaNotificaciones) {
  if (notificaciones.length === 0) {
    return <EstadoVacio titulo="No tienes notificaciones" icono="alarma">Cuando salte una alerta que te corresponda, aparecerá aquí.</EstadoVacio>;
  }
  return (
    <Tarjeta titulo={<span data-testid="no-leidas">No leídas: {noLeidas}</span>}>
      <ul className="divide-y divide-borde">
        {notificaciones.map((n) => (
          <Fila key={n.id} n={n} />
        ))}
      </ul>
    </Tarjeta>
  );
}
