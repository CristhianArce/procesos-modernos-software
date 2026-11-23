import Link from "next/link";
import { notFound } from "next/navigation";
import { instantanea } from "@/modulos/estado/service";
import { buscarNodo } from "@/modulos/nodos/service";
import { formatearFecha } from "@/modulos/dashboard/formato";
import { formatoCorriente, formatoPotencia, formatoTension } from "@/modulos/ui/formato";
import { IndicadorEstado } from "@/modulos/ui/IndicadorEstado";
import { Tarjeta } from "@/modulos/ui/Tarjeta";
import { registro } from "@/nav/registro";

export const dynamic = "force-dynamic";

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-sc border border-borde bg-panel-2/60 px-3 py-2">
      <dt className="text-xs text-tenue">{titulo}</dt>
      <dd className="cifra mt-0.5 text-lg text-texto">{valor}</dd>
    </div>
  );
}

// Ficha del nodo: sus datos y los paneles que declaren los módulos en su paneles.ts.
// Ninguna historia edita esta página para agregar un panel.
export default async function FichaNodo({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [nodo, { nodos }] = await Promise.all([buscarNodo(id), instantanea()]);
  if (!nodo) notFound();
  const estado = nodos.find((n) => n.id === nodo.id);

  return (
    <article className="space-y-6">
      <header>
        <nav aria-label="Ruta" className="text-sm text-tenue">
          <Link href="/nodos" className="enlace">
            Nodos
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{nodo.nombre}</span>
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="titulo-pagina">{nodo.nombre}</h1>
          {estado && <IndicadorEstado estado={estado.nivel} />}
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-tenue">Ubicación</dt>
            <dd>{nodo.ubicacion ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-tenue">Conexión</dt>
            <dd>
              <IndicadorEstado
                estado={nodo.estado === "conectado" ? "normal" : "desconectado"}
                etiqueta={nodo.estado === "conectado" ? "Conectado" : "Desconectado"}
              />
            </dd>
          </div>
          {estado?.tomadaEn && (
            <div className="flex gap-2">
              <dt className="text-tenue">Última lectura</dt>
              <dd className="cifra">{formatearFecha(estado.tomadaEn)}</dd>
            </div>
          )}
        </dl>
      </header>
      {estado && (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Dato titulo="Tensión media" valor={formatoTension(estado.voltaje)} />
          <Dato titulo="Corriente" valor={formatoCorriente(estado.corriente)} />
          <Dato titulo="Potencia" valor={formatoPotencia(estado.potencia)} />
          <Dato titulo="Alertas activas (15 min)" valor={String(estado.alertasActivas)} />
        </dl>
      )}
      {registro.paneles.map((panel) => (
        <Tarjeta key={panel.titulo} titulo={panel.titulo}>
          <panel.Componente nodoId={nodo.id} />
        </Tarjeta>
      ))}
    </article>
  );
}
