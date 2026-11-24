import { EstadoVacio } from "@/modulos/ui/EstadoVacio";

type Props = { total: number; afectados: { id: string; alias: string }[] };

/** Total y lista de afectados de un nodo, en el orden recibido (decisión #1); vacío con total 0. */
export function ListaAfectados({ total, afectados }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-tenue">
        Total de afectados:{" "}
        <span className="cifra text-base text-texto" data-testid="afectados-total">
          {total}
        </span>
      </p>
      {afectados.length === 0 ? (
        <EstadoVacio titulo="Este nodo no tiene afectados">Aún no hay usuarios ni dispositivos asociados a este nodo.</EstadoVacio>
      ) : (
        <ul data-testid="afectados-lista" className="divide-y divide-borde">
          {afectados.map((a) => (
            <li key={a.id} data-testid="afectado" className="py-1.5">
              {a.alias}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
