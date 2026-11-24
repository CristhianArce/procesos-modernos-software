import { listarNodos } from "@/modulos/nodos/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";
import { consultaHistoricoSchema } from "@/modulos/historico/schema";
import { consultarHistorico } from "@/modulos/historico/service";
import { filtrosDeBusqueda } from "@/modulos/historico/url";
import { FiltrosHistorico } from "@/modulos/historico/ui/FiltrosHistorico";
import { PaginadorHistorico } from "@/modulos/historico/ui/PaginadorHistorico";
import { TablaHistorico } from "@/modulos/historico/ui/TablaHistorico";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaHistorico({ searchParams }: Props) {
  const filtros = filtrosDeBusqueda(await searchParams);
  const consulta = consultaHistoricoSchema.safeParse(filtros);
  const [nodos, sensores] = await Promise.all([listarNodos(), listarTodosLosSensores()]);
  const nombreNodo = new Map(nodos.map((n) => [n.id, n.nombre]));
  const opcionesSensor = sensores.map((s) => ({ id: s.id, nombre: s.nombre, nodoNombre: nombreNodo.get(s.nodoId) ?? "" }));
  const pagina = consulta.success ? await consultarHistorico(consulta.data) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Histórico</h1>
        <p className="subtitulo-pagina">Lecturas de los sensores, de la más reciente a la más antigua, con filtros por nodo, sensor y fechas.</p>
      </header>
      <Tarjeta>
        <FiltrosHistorico nodos={nodos.map((n) => ({ id: n.id, nombre: n.nombre }))} sensores={opcionesSensor} valores={filtros} />
      </Tarjeta>
      <Tarjeta>
        {pagina ? (
          <div className="space-y-4">
            <TablaHistorico items={pagina.items} />
            <PaginadorHistorico pagina={pagina.pagina} total={pagina.total} porPagina={pagina.porPagina} filtros={filtros} />
          </div>
        ) : (
          <EstadoError titulo="Filtros no válidos" detalle={consulta.error?.issues.map((i) => i.message).join(". ")} />
        )}
      </Tarjeta>
    </div>
  );
}
