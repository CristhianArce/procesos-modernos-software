type Opcion = { id: string; nombre: string };
type Valores = { nodoId?: string; sensorId?: string; desde?: string; hasta?: string };

type Props = { nodos: Opcion[]; sensores: (Opcion & { nodoId: string })[]; valores: Valores };

/** Filtros del histórico: viajan en la URL (GET), así que la vista se puede compartir y no hace falta JavaScript. */
export function FiltrosHistorico({ nodos, sensores, valores }: Props) {
  return (
    <form method="get" aria-label="Filtros del histórico" className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
      <label className="block text-sm text-tenue">
        Nodo
        <select name="nodoId" defaultValue={valores.nodoId ?? ""} className="campo mt-1">
          <option value="">Todos los nodos</option>
          {nodos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-tenue">
        Sensor
        <select name="sensorId" defaultValue={valores.sensorId ?? ""} className="campo mt-1">
          <option value="">Todos los sensores</option>
          {sensores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-tenue">
        Desde
        <input type="text" name="desde" defaultValue={valores.desde ?? ""} placeholder="AAAA-MM-DDTHH:mm:ssZ" className="campo cifra mt-1" />
      </label>
      <label className="block text-sm text-tenue">
        Hasta
        <input type="text" name="hasta" defaultValue={valores.hasta ?? ""} placeholder="AAAA-MM-DDTHH:mm:ssZ" className="campo cifra mt-1" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="boton-primario">
          Aplicar filtros
        </button>
        <a href="/historico" className="enlace text-sm">
          Limpiar filtros
        </a>
      </div>
    </form>
  );
}
