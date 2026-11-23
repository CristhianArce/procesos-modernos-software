import { listarAlertas } from "@/modulos/alertas/service";
import { ListaAlertas } from "@/modulos/dashboard/ui/ListaAlertas";
import { TarjetaSensor } from "@/modulos/dashboard/ui/TarjetaSensor";
import { instantanea } from "@/modulos/estado/service";
import { FranjaIndicadores } from "@/modulos/estado/ui/FranjaIndicadores";
import { lecturasRecientesPorSensor } from "@/modulos/lecturas/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";
import { armarMimico } from "@/modulos/topologia/mimico";
import { obtenerTopologia } from "@/modulos/topologia/service";
import { LeyendaMimico } from "@/modulos/topologia/ui/LeyendaMimico";
import { Mimico } from "@/modulos/topologia/ui/Mimico";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

const LECTURAS_POR_GRAFICA = 50; // RN-5
const ALERTAS_VISIBLES = 20; // decisión #1

export default async function PaginaDashboard() {
  const [sensores, alertas, estado, topologia] = await Promise.all([
    listarTodosLosSensores(),
    listarAlertas({ limite: ALERTAS_VISIBLES }),
    instantanea(),
    obtenerTopologia(),
  ]);
  const series = await lecturasRecientesPorSensor(
    sensores.map((s) => s.id),
    LECTURAS_POR_GRAFICA,
  );
  const nombres = new Map(sensores.map((s) => [s.id, s.nombre]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Dashboard</h1>
        <p className="subtitulo-pagina">Estado de la red, lecturas por sensor y alertas recientes.</p>
      </header>
      <FranjaIndicadores indicadores={estado.indicadores} />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_30rem]">
        <Tarjeta titulo="Mímico de la red">
          <div className="h-[clamp(22rem,50vw,640px)]">
            <Mimico datos={armarMimico(topologia, estado.nodos)} />
          </div>
          <div className="mt-3">
            <LeyendaMimico />
          </div>
        </Tarjeta>
        <div id="alarmas" className="scroll-mt-4">
          <Tarjeta titulo="Alertas" className="flex max-h-[32rem] flex-col 2xl:max-h-[calc(clamp(22rem,50vw,640px)+6rem)] [&>div]:overflow-y-auto">
            <ListaAlertas alertas={alertas} nombres={nombres} />
          </Tarjeta>
        </div>
      </div>
      <section aria-labelledby="titulo-sensores">
        <h2 id="titulo-sensores" className="mb-3 text-xs font-semibold tracking-wider text-tenue uppercase">
          Sensores
        </h2>
        {sensores.length === 0 ? (
          <Tarjeta>
            <p className="text-tenue">Aún no hay sensores.</p>
          </Tarjeta>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {sensores.map((s) => (
              <TarjetaSensor key={s.id} nombre={s.nombre} lecturas={series.get(s.id) ?? []} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
