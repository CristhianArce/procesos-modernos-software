import { sesionActual } from "@/lib/dal";
import { instantanea } from "@/modulos/estado/service";
import { FormularioNodo } from "@/modulos/nodos/ui/FormularioNodo";
import { TablaNodos } from "@/modulos/nodos/ui/TablaNodos";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

export default async function PaginaNodos() {
  const [sesion, { nodos }] = await Promise.all([sesionActual(), instantanea()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Nodos</h1>
        <p className="subtitulo-pagina">Subestaciones, transformadores y alimentadores de la red, con su estado actual.</p>
      </header>
      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Tarjeta>{nodos.length === 0 ? <p className="text-tenue">Aún no hay nodos.</p> : <TablaNodos nodos={nodos} />}</Tarjeta>
        {/* Ocultar el formulario es cosmético: la API verifica el rol. */}
        {sesion?.rol === "administrador" && (
          <Tarjeta titulo="Nuevo nodo">
            <FormularioNodo />
          </Tarjeta>
        )}
      </div>
    </div>
  );
}
