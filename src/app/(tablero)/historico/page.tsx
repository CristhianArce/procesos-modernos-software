import { consultaHistoricoSchema } from "@/modulos/historico/schema";
import { consultarHistorico } from "@/modulos/historico/service";
import { FiltrosHistorico } from "@/modulos/historico/ui/FiltrosHistorico";
import { TablaHistorico } from "@/modulos/historico/ui/TablaHistorico";
import { listarNodos } from "@/modulos/nodos/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

type Busqueda = Promise<Record<string, string | string[] | undefined>>;

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Filtros en la URL (decisión #8); un fallo del servidor lo cubre (tablero)/error.tsx.
export default async function PaginaHistorico({ searchParams }: { searchParams: Busqueda }) {
  const crudos = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, primero(v)]));
  const consulta = consultaHistoricoSchema.safeParse(crudos);
  const [nodos, sensores, resultado] = await Promise.all([
    listarNodos(),
    listarTodosLosSensores(),
    consulta.success ? consultarHistorico(consulta.data) : null,
  ]);
  const filtros = consulta.success ? consulta.data : {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Histórico de lecturas</h1>
        <p className="subtitulo-pagina">Lecturas de la red, la más reciente primero. Filtra por nodo, sensor y días (hora de Bogotá).</p>
      </header>
      <Tarjeta>
        <FiltrosHistorico nodos={nodos} sensores={sensores} valores={filtros} />
      </Tarjeta>
      <Tarjeta>
        {resultado ? (
          <TablaHistorico resultado={resultado} filtros={filtros} />
        ) : (
          <EstadoError
            titulo="Filtros inválidos"
            detalle={'Revisa las fechas: deben tener el formato AAAA-MM-DD y "Desde" no puede ser posterior a "Hasta".'}
          />
        )}
      </Tarjeta>
    </div>
  );
}
