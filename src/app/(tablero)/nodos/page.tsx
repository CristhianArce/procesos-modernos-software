import Link from "next/link";
import { sesionActual } from "@/lib/dal";
import { listarNodos } from "@/modulos/nodos/service";
import { FormularioNodo } from "@/modulos/nodos/ui/FormularioNodo";

export const dynamic = "force-dynamic";

export default async function PaginaNodos() {
  const [sesion, nodos] = await Promise.all([sesionActual(), listarNodos()]);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Nodos</h1>
      {nodos.length === 0 ? (
        <p className="mt-4 text-tenue">Aún no hay nodos.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-borde">
              <th className="py-2">Nombre</th>
              <th className="py-2">Ubicación</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {nodos.map((nodo) => (
              <tr key={nodo.id} className="border-b border-borde/60">
                <td className="py-2">
                  <Link href={`/nodos/${nodo.id}`} className="hover:underline">
                    {nodo.nombre}
                  </Link>
                </td>
                <td className="py-2">{nodo.ubicacion ?? "—"}</td>
                <td className="py-2">{nodo.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Ocultar el formulario es cosmético: la API verifica el rol. */}
      {sesion?.rol === "administrador" && <FormularioNodo />}
    </section>
  );
}
