import type { FiltrosHistorico as Filtros } from "../schema";

type Props = {
  nodos: { id: string; nombre: string }[];
  sensores: { id: string; nodoId: string; nombre: string }[];
  valores: Filtros;
};

/** Formulario GET del histórico: sin JavaScript, los filtros viajan en la URL (decisión #8). */
export function FiltrosHistorico({ nodos, sensores, valores }: Props) {
  const nombreNodo = new Map(nodos.map((n) => [n.id, n.nombre]));

  return (
    <form method="get" action="/historico" data-testid="filtros-historico" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto_auto] xl:items-end">
      <div>
        <label htmlFor="filtro-nodo" className="etiqueta-campo">
          Nodo
        </label>
        <select id="filtro-nodo" name="nodoId" defaultValue={valores.nodoId ?? ""} className="campo">
          <option value="">Todos</option>
          {nodos.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filtro-sensor" className="etiqueta-campo">
          Sensor
        </label>
        <select id="filtro-sensor" name="sensorId" defaultValue={valores.sensorId ?? ""} className="campo">
          <option value="">Todos</option>
          {sensores.map((s) => (
            <option key={s.id} value={s.id}>
              {`${nombreNodo.get(s.nodoId) ?? "—"} · ${s.nombre}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filtro-desde" className="etiqueta-campo">
          Desde
        </label>
        <input id="filtro-desde" name="desde" type="date" defaultValue={valores.desde ?? ""} className="campo" />
      </div>
      <div>
        <label htmlFor="filtro-hasta" className="etiqueta-campo">
          Hasta
        </label>
        <input id="filtro-hasta" name="hasta" type="date" defaultValue={valores.hasta ?? ""} className="campo" />
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" className="boton-primario">
          Filtrar
        </button>
        <a href="/historico" className="enlace text-sm">
          Limpiar filtros
        </a>
      </div>
    </form>
  );
}
