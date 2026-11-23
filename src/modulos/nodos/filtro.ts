const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Nodos cuyo nombre o ubicación contiene el texto, sin importar mayúsculas ni tildes. */
export function filtrarNodos<T extends { nombre: string; ubicacion: string | null }>(nodos: T[], texto: string): T[] {
  const buscado = normalizar(texto.trim());
  if (!buscado) return nodos;
  return nodos.filter((n) => normalizar(`${n.nombre} ${n.ubicacion ?? ""}`).includes(buscado));
}
