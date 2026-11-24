import type { AfectadosDeNodo } from "../service";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";

/** Total y lista de afectados de un nodo, en el orden recibido (CA-1); con total 0, estado vacío (CA-3). */
export function ListaAfectados({ total, afectados }: AfectadosDeNodo) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-tenue">
        Total de afectados:{" "}
        <span className="cifra text-base font-semibold text-texto" data-testid="total-afectados">
          {total}
        </span>
      </p>
      {afectados.length === 0 ? (
        <EstadoVacio titulo="Sin afectados">Ningún usuario depende de este nodo.</EstadoVacio>
      ) : (
        <ul aria-label="Afectados del nodo" className="divide-y divide-borde">
          {afectados.map((a) => (
            <li key={a.id} className="py-2">
              {a.alias}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
