import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PaginaAcerca from "../../../app/(tablero)/acerca/page";
import { obtenerAcerca } from "../service";

describe("página /acerca", () => {
  it("#6 CA-2: la página muestra el nombre y la versión", () => {
    const html = renderToStaticMarkup(<PaginaAcerca />);
    const { nombre, version } = obtenerAcerca();

    expect(html).toContain(nombre);
    expect(html).toContain(version);
  });
});
