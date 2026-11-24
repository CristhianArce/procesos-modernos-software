import { formatearFecha, UNIDAD } from "@/modulos/dashboard/formato";
import { Insignia } from "@/modulos/ui/Insignia";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { cifraConUnidad } from "@/modulos/ui/formato";
import { Tarjeta } from "@/modulos/ui/Tarjeta";
import type { Notificacion } from "../tipos";

type Props = { notificaciones: Notificacion[]; noLeidas: number };

const MAGNITUD = { voltaje: "Voltaje", corriente: "Corriente", potencia: "Potencia" } as const;

/** Estado con texto y forma además del color: «● Sin leer» / «✓ Leída». */
function EstadoLectura({ leida }: { leida: boolean }) {
  return leida ? <Insignia tono="neutro">✓ Leída</Insignia> : <Insignia tono="acento">● Sin leer</Insignia>;
}

export function ListaNotificaciones({ notificaciones, noLeidas }: Props) {
  return (
    <Tarjeta
      titulo="Notificaciones"
      acciones={
        <p className="text-sm text-tenue">
          <span data-testid="no-leidas" className="cifra text-texto">
            {noLeidas}
          </span>{" "}
          sin leer
        </p>
      }
    >
      {notificaciones.length === 0 ? (
        <div data-testid="notificaciones-vacio">
          <EstadoVacio titulo="Sin notificaciones" icono="alarma">
            Cuando salte una alerta que te corresponda, aparecerá aquí.
          </EstadoVacio>
        </div>
      ) : (
        <ul className="divide-y divide-borde">
          {notificaciones.map((n) => (
            <li key={n.id} data-testid="notificacion" className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-texto">{n.sensor}</p>
                <p className="text-sm text-tenue">
                  {MAGNITUD[n.magnitud]}: <span className="cifra text-texto">{cifraConUnidad(n.valor, UNIDAD[n.magnitud])}</span> ·{" "}
                  <time dateTime={n.fecha}>{formatearFecha(n.fecha)}</time>
                </p>
              </div>
              <EstadoLectura leida={n.leida} />
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
