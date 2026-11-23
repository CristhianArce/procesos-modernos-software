import { notFound } from "next/navigation";
import { buscarNodo } from "@/modulos/nodos/service";
import { registro } from "@/nav/registro";

export const dynamic = "force-dynamic";

// Ficha del nodo: sus datos y los paneles que declaren los módulos en su paneles.ts.
// Ninguna historia edita esta página para agregar un panel.
export default async function FichaNodo({ params }: { params: Promise<{ id: string }> }) {
  const nodo = await buscarNodo((await params).id);
  if (!nodo) notFound();

  return (
    <article>
      <h1 className="text-2xl font-semibold">{nodo.nombre}</h1>
      <dl className="mt-4 grid max-w-md grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-tenue">Ubicación</dt>
        <dd>{nodo.ubicacion ?? "—"}</dd>
        <dt className="text-tenue">Estado</dt>
        <dd>{nodo.estado}</dd>
      </dl>
      {registro.paneles.map((panel) => (
        <section key={panel.titulo} aria-label={panel.titulo} className="mt-8">
          <h2 className="text-lg font-semibold">{panel.titulo}</h2>
          <panel.Componente nodoId={nodo.id} />
        </section>
      ))}
    </article>
  );
}
