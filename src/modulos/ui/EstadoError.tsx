import { Icono } from "./Icono";

type Props = { titulo?: string; detalle?: string; onReintentar?: () => void };

/** Fallo al cargar una pantalla o un bloque, con la opción de reintentar. */
export function EstadoError({ titulo = "No se pudo cargar esta pantalla", detalle, onReintentar }: Props) {
  return (
    <div role="alert" data-estado="critico" className="mx-auto max-w-lg rounded-sc-lg border border-critico/50 bg-panel p-6 text-center shadow-sc">
      <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-critico/15 text-critico">
        <Icono nombre="alarma" />
      </span>
      <h2 className="text-base font-semibold text-texto">{titulo}</h2>
      <p className="mt-1 text-sm text-tenue">{detalle ?? "Revisa la conexión con el servidor y vuelve a intentarlo."}</p>
      {onReintentar && (
        <button type="button" className="boton-primario mt-4" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
