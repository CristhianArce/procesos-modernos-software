/** Parámetros de la URL ya sin vacíos: el formulario `GET` envía los campos que el usuario no llenó como texto vacío. */
export function filtrosDeBusqueda(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const filtros: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(params)) {
    const primero = Array.isArray(valor) ? valor[0] : valor;
    if (primero) filtros[clave] = primero;
  }
  return filtros;
}

/** Enlace a una página del histórico que conserva los filtros aplicados. */
export function enlacePagina(filtros: Record<string, string>, pagina: number): string {
  const { pagina: _anterior, ...resto } = filtros;
  return `/historico?${new URLSearchParams({ ...resto, pagina: String(pagina) })}`;
}
