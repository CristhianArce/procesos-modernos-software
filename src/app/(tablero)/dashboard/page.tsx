import { sesionActual } from "@/lib/dal";
import { TableroVivo } from "@/modulos/dashboard/ui/TableroVivo";
import { TarjetaSensor } from "@/modulos/dashboard/ui/TarjetaSensor";
import { lecturasRecientesPorSensor } from "@/modulos/lecturas/service";
import { listarTodosLosSensores } from "@/modulos/sensores/service";
import { obtenerTopologia } from "@/modulos/topologia/service";
import { Tarjeta } from "@/modulos/ui/Tarjeta";

export const dynamic = "force-dynamic";

const LECTURAS_POR_GRAFICA = 50; // RN-5

// Indicadores, mímico y alarmas se actualizan en vivo (TableroVivo, con el sondeo del shell);
// las gráficas por sensor son del momento de cargar la página.
export default async function PaginaDashboard() {
  const [sesion, sensores, topologia] = await Promise.all([sesionActual(), listarTodosLosSensores(), obtenerTopologia()]);
  const series = await lecturasRecientesPorSensor(
    sensores.map((s) => s.id),
    LECTURAS_POR_GRAFICA,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-pagina">Dashboard</h1>
        <p className="subtitulo-pagina">Estado de la red en vivo, alarmas y lecturas por sensor.</p>
      </header>
      {/* Ocultar el editor es cosmético: la API de topología exige el rol administrador (403 al técnico). */}
      <TableroVivo topologia={topologia} puedeEditar={sesion?.rol === "administrador"} />
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
