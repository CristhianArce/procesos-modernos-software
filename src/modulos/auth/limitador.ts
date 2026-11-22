// Límite de intentos fallidos de login en memoria (design.md, decisión #4): suficiente para una sola
// instancia; se reinicia con cada despliegue. Cada clave guarda las marcas de tiempo de sus fallos.
type Opciones = { maximo?: number; ventanaMs?: number; ahora?: () => number };

export function crearLimitador({ maximo = 5, ventanaMs = 60_000, ahora = Date.now }: Opciones = {}) {
  const fallos = new Map<string, number[]>();

  const vigentes = (clave: string, desde: number) => (fallos.get(clave) ?? []).filter((t) => t > desde);

  function podar(desde: number) {
    for (const clave of fallos.keys()) {
      const marcas = vigentes(clave, desde);
      if (marcas.length === 0) fallos.delete(clave);
      else fallos.set(clave, marcas);
    }
  }

  return {
    /** Segundos hasta que alguna clave bloqueada vuelva a aceptar intentos, o null si ninguna lo está. */
    reintentarEn(claves: string[]): number | null {
      const ahoraMs = ahora();
      const esperas = claves.flatMap((clave) => {
        const marcas = vigentes(clave, ahoraMs - ventanaMs);
        return marcas.length >= maximo ? [Math.ceil((marcas[marcas.length - maximo] + ventanaMs - ahoraMs) / 1000)] : [];
      });
      return esperas.length > 0 ? Math.max(...esperas) : null;
    },

    registrarFallo(claves: string[]): void {
      const ahoraMs = ahora();
      podar(ahoraMs - ventanaMs);
      for (const clave of claves) fallos.set(clave, [...(fallos.get(clave) ?? []), ahoraMs]);
    },

    tamano: () => fallos.size,
  };
}

export const limitadorLogin = crearLimitador();
