import Link from "next/link";

type Props = {
  nodos: { id: string; nombre: string }[];
  sensores: { id: string; nombre: string; nodoNombre: string }[];
  valores: Record<string, string>;
};

/** Filtros del histórico: un formulario `GET` que recarga la página con los parámetros (los ids, no los nombres). */
export function FiltrosHistorico({ nodos, sensores, valores }: Props) {
  return (
    <form method="get" action="/historico" className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
      <label className="block">
        <span className="mb-1 block text-sm text-tenue">Nodo</span>
        <select name="nodoId" defaultValue={valores.nodoId ?? ""} className="campo">
          <option value="">Todos</option>
          {nodos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-tenue">Sensor</span>
        <select name="sensorId" defaultValue={valores.sensorId ?? ""} className="campo">
          <option value="">Todos</option>
          {sensores.map((s) => (
            <option key={s.id} value={s.id}>
              {`${s.nombre} · ${s.nodoNombre}`}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-tenue">Desde (UTC)</span>
        <input name="desde" type="text" defaultValue={valores.desde ?? ""} placeholder="2026-03-01T00:00:00Z" className="campo" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-tenue">Hasta (UTC)</span>
        <input name="hasta" type="text" defaultValue={valores.hasta ?? ""} placeholder="2026-03-31T23:59:59Z" className="campo" />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="boton-primario">
          Aplicar filtros
        </button>
        <Link href="/historico" className="enlace">
          Limpiar filtros
        </Link>
      </div>
    </form>
  );
}
