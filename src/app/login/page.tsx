import { FormularioLogin } from "@/modulos/auth/ui/FormularioLogin";

// Pública (proxy.ts excluye /login) y fuera del grupo (tablero): no lleva el layout con menú.
export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <FormularioLogin />
    </main>
  );
}
