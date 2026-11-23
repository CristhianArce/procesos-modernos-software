// Cifras en español de Colombia (coma decimal).
const numero = (decimales: number) => new Intl.NumberFormat("es-CO", { maximumFractionDigits: decimales });
const N0 = numero(0);
const N1 = numero(1);
const N2 = numero(2);

const o = <T,>(f: (n: number) => T) => (n: number | null) => (n === null ? "—" : f(n));

export const formatoPotencia = o((w) => (Math.abs(w) >= 1000 ? `${N2.format(w / 1000)} kW` : `${N0.format(w)} W`));
export const formatoTension = o((v) => `${N1.format(v)} V`);
export const formatoCorriente = o((a) => `${N1.format(a)} A`);

/** Cifra con su unidad, coma decimal y hasta dos decimales (alarmas, avisos, medidores y panel lateral). */
export const cifraConUnidad = (valor: number, unidad: string) => `${N2.format(valor)} ${unidad}`;
