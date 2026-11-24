const r1 = (x: number) => Math.round(x * 10) / 10;

/** Atributo `d` de un trazo SVG que ocupa `ancho` × `alto`, con el mínimo abajo. */
export function trazoSparkline(valores: readonly number[], ancho: number, alto: number): string {
  if (valores.length < 2) return "";
  const min = Math.min(...valores);
  const rango = Math.max(...valores) - min;
  const paso = ancho / (valores.length - 1);
  return valores
    .map((v, i) => {
      const y = rango === 0 ? alto / 2 : alto - ((v - min) / rango) * alto;
      return `${i === 0 ? "M" : "L"}${r1(i * paso)},${r1(y)}`;
    })
    .join("");
}
