import { listarAlertas } from "@/modulos/alertas/service";
import { ListaAlertas } from "@/modulos/dashboard/ui/ListaAlertas";
import { TarjetaSensor } from "@/modulos/dashboard/ui/TarjetaSensor";
import { lecturasRecientesPorSensor } from "@/modulos/lecturas/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";

export const dynamic = "force-dynamic";

const LECTURAS_POR_GRAFICA = 50; // RN-5
const ALERTAS_VISIBLES = 20; // decisión #1

export default async function PaginaDashboard() {
  const [sensores, alertas] = await Promise.all([listarTodosLosSensores(), listarAlertas({ limite: ALERTAS_VISIBLES })]);
  const series = await lecturasRecientesPorSensor(
    sensores.map((s) => s.id),
    LECTURAS_POR_GRAFICA,
  );
  const nombres = new Map(sensores.map((s) => [s.id, s.nombre]));

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <h2 className="mt-6 text-lg font-semibold">Sensores</h2>
      {sensores.length === 0 ? (
        <p className="mt-2 text-tenue">Aún no hay sensores.</p>
      ) : (
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          {sensores.map((s) => (
            <TarjetaSensor key={s.id} nombre={s.nombre} lecturas={series.get(s.id) ?? []} />
          ))}
        </div>
      )}
      <h2 className="mt-6 text-lg font-semibold">Alertas</h2>
      <ListaAlertas alertas={alertas} nombres={nombres} />
    </section>
  );
}
