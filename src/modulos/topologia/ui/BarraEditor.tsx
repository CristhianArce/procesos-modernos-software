import { TIPOS_NODO, type TipoNodo } from "../tipos";
import { TIPO } from "./SimboloNodo";

export type Mensaje = { tipo: "ok" | "error"; texto: string };

type Props = {
  editando: boolean;
  pendientes: number;
  nodoElegido: { nombre: string; tipo: TipoNodo } | null;
  enlaceElegido: string | null;
  ocupado: boolean;
  mensaje: Mensaje | null;
  onEditar: () => void;
  onGuardar: () => void;
  onDescartar: () => void;
  onSalir: () => void;
  onBorrarEnlace: () => void;
  onCambiarTipo: (tipo: TipoNodo) => void;
};

const secundario = "rounded-sc border border-borde-fuerte px-3 py-1.5 text-sm text-texto hover:bg-panel-2 disabled:opacity-50";

/** Controles del editor de la topología (solo se monta para administradores). */
export function BarraEditor(p: Props) {
  if (!p.editando) {
    return (
      <button type="button" className={secundario} onClick={p.onEditar}>
        Editar topología
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="boton-primario py-1.5" disabled={p.ocupado || p.pendientes === 0} onClick={p.onGuardar}>
        {p.pendientes ? `Guardar posiciones (${p.pendientes})` : "Guardar posiciones"}
      </button>
      <button type="button" className={secundario} disabled={p.ocupado || p.pendientes === 0} onClick={p.onDescartar}>
        Descartar cambios
      </button>
      {p.enlaceElegido && (
        <button type="button" className={`${secundario} border-critico/60 text-critico`} disabled={p.ocupado} onClick={p.onBorrarEnlace}>
          {`Borrar enlace ${p.enlaceElegido}`}
        </button>
      )}
      {p.nodoElegido && (
        <label className="flex items-center gap-2 text-sm text-tenue">
          {`Tipo de ${p.nodoElegido.nombre}`}
          <select className="campo w-auto py-1 text-sm capitalize" value={p.nodoElegido.tipo} onChange={(e) => p.onCambiarTipo(e.target.value as TipoNodo)}>
            {TIPOS_NODO.map((t) => (
              <option key={t} value={t}>
                {TIPO[t]}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="button" className={`${secundario} ml-auto`} disabled={p.ocupado} onClick={p.onSalir}>
        Salir de edición
      </button>
      <p role="status" className="w-full text-xs">
        {p.mensaje ? (
          <span className={p.mensaje.tipo === "error" ? "text-critico" : "text-normal"}>{p.mensaje.texto}</span>
        ) : p.nodoElegido ? (
          <span className="text-advertencia">{`Elige el nodo destino del enlace desde ${p.nodoElegido.nombre}, o el mismo nodo para cancelar.`}</span>
        ) : null}
      </p>
    </div>
  );
}
