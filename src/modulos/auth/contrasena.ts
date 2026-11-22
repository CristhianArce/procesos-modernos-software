import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Formato guardado: scrypt$<sal en hex>$<hash en hex>. Parámetros de Node por defecto (N=16384, r=8, p=1);
// si cambian, se versiona el prefijo (design.md, decisión #2).
const LONGITUD_CLAVE = 64;
const LONGITUD_SAL = 16;
const PREFIJO = "scrypt";

const derivar = (contrasena: string, sal: Buffer) =>
  new Promise<Buffer>((resolver, rechazar) => {
    scrypt(contrasena, sal, LONGITUD_CLAVE, (error, clave) => (error ? rechazar(error) : resolver(clave)));
  });

export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(LONGITUD_SAL);
  const clave = await derivar(contrasena, sal);
  return `${PREFIJO}$${sal.toString("hex")}$${clave.toString("hex")}`;
}

/** Compara en tiempo constante; un hash mal formado no verifica y no lanza. */
export async function verificarContrasena(contrasena: string, almacenado: string): Promise<boolean> {
  const [prefijo, salHex, claveHex, ...resto] = almacenado.split("$");
  if (prefijo !== PREFIJO || resto.length > 0 || !/^[0-9a-f]+$/.test(salHex ?? "") || !/^[0-9a-f]+$/.test(claveHex ?? "")) {
    return false;
  }
  const esperada = Buffer.from(claveHex, "hex");
  const obtenida = await derivar(contrasena, Buffer.from(salHex, "hex"));
  return esperada.length === obtenida.length && timingSafeEqual(esperada, obtenida);
}
