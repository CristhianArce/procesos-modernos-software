import { FormularioLogin } from "@/modulos/auth/ui/FormularioLogin";
import { Marca, NOMBRE_RED } from "@/shell/marca";

// Pública (proxy.ts excluye /login) y fuera del grupo (tablero): no lleva el shell con menú.
export default function PaginaLogin() {
  return (
    <main className="fondo-reticula flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Marca compacta />
        </div>
        <div className="rounded-sc-lg border border-borde bg-panel/95 p-6 shadow-sc">
          <FormularioLogin />
        </div>
        <p className="mt-4 text-center text-xs text-apagado">{NOMBRE_RED} · sala de control</p>
      </div>
    </main>
  );
}
