import { ConsultaHistorico } from "@/modulos/historico/ui/ConsultaHistorico";
import { listarNodos } from "@/modulos/nodos/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";

export const dynamic = "force-dynamic";

export default async function PaginaHistorico() {
  const [nodos, sensores] = await Promise.all([listarNodos(), listarTodosLosSensores()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Histórico</h1>
        <p className="subtitulo-pagina">Lecturas de los sensores, de la más reciente a la más antigua, con filtros por nodo, sensor y fechas.</p>
      </header>
      <ConsultaHistorico
        nodos={nodos.map((n) => ({ id: n.id, nombre: n.nombre }))}
        sensores={sensores.map((s) => ({ id: s.id, nodoId: s.nodoId, nombre: s.nombre }))}
      />
    </div>
  );
}
