// Ganchos de arranque del servidor de Next. Solo enciende el simulador continuo si SIM_AUTO_MS está definida
// (milisegundos entre pasos, mínimo 500). Apagado por defecto: en producción no se define.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const ms = Number(process.env.SIM_AUTO_MS);
  if (!process.env.SIM_AUTO_MS || !Number.isFinite(ms) || ms < 500) return;
  const { iniciarSimuladorContinuo } = await import("@/modulos/simulador/continuo");
  iniciarSimuladorContinuo(ms);
}
