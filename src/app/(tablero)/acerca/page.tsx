import { obtenerAcerca } from "../../../modulos/acerca/service";

export default function PaginaAcerca() {
  const { nombre, version } = obtenerAcerca();

  return (
    <main>
      <h1>Acerca de</h1>
      <dl>
        <dt>Nombre</dt>
        <dd>{nombre}</dd>
        <dt>Versión</dt>
        <dd>{version}</dd>
      </dl>
    </main>
  );
}
