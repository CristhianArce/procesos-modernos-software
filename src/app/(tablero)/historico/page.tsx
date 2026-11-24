import { historicoFiltrosSchema, TAMANO_PAGINA } from "@/modulos/historico/schema";
import { consultarHistorico } from "@/modulos/historico/service";
import { FiltrosHistorico } from "@/modulos/historico/ui/FiltrosHistorico";
import { PaginacionHistorico } from "@/modulos/historico/ui/PaginacionHistorico";
import { TablaHistorico } from "@/modulos/historico/ui/TablaHistorico";
import { listarNodos } from "@/modulos/nodos/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";
import { EstadoError } from "@/modulos/ui/EstadoError";
import { EstadoVacio } from "@/modulos/ui/EstadoVacio";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Un parámetro repetido en la URL (`?nodoId=a&nodoId=b`) llega como arreglo: se toma el primero.
const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function PaginaHistorico({ searchParams }: Props) {
  const crudos = await searchParams;
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(crudos)) {
    const v = primero(valor);
    if (v) parametros.set(clave, v);
  }

  const filtros = historicoFiltrosSchema.safeParse(Object.fromEntries(parametros));
  const [nodos, sensores] = await Promise.all([listarNodos(), listarTodosLosSensores()]);
  const valores = Object.fromEntries(["nodoId", "sensorId", "desde", "hasta"].map((k) => [k, parametros.get(k) ?? undefined]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Histórico</h1>
        <p className="subtitulo-pagina">Lecturas de los sensores, {`de la más reciente a la más antigua, de ${TAMANO_PAGINA} en ${TAMANO_PAGINA}.`}</p>
      </header>
      <Tarjeta>
        <FiltrosHistorico nodos={nodos} sensores={sensores} valores={valores} />
      </Tarjeta>
      <Tarjeta>
        {!filtros.success ? (
          <EstadoError titulo="Filtros no válidos" detalle={filtros.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ")} />
        ) : (
          <Resultado filtros={filtros.data} parametros={parametros} />
        )}
      </Tarjeta>
    </div>
  );
}

async function Resultado({ filtros, parametros }: { filtros: Parameters<typeof consultarHistorico>[0]; parametros: URLSearchParams }) {
  const { items, pagina, tamano, total } = await consultarHistorico(filtros);
  if (items.length === 0) return <EstadoVacio titulo="No hay lecturas con estos filtros" icono="buscar">Cambia o limpia los filtros para ver más lecturas.</EstadoVacio>;
  return (
    <>
      <TablaHistorico items={items} />
      <PaginacionHistorico pagina={pagina} total={total} tamano={tamano} parametros={parametros} />
    </>
  );
}
