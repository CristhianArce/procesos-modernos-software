import "server-only";
import pino, { type DestinationStream } from "pino";

// Segunda defensa: el envoltorio nunca registra cuerpos, pero si alguien pasa uno, estas claves salen redactadas.
const SENSIBLES = ["password", "contrasena", "token", "authorization", "cookie", "secret"];

export function crearLogger(destino?: DestinationStream, nivel = process.env.LOG_LEVEL ?? "info") {
  return pino(
    {
      level: nivel,
      redact: {
        paths: SENSIBLES.flatMap((k) => [k, `*.${k}`]),
        censor: "[redactado]",
      },
    },
    destino,
  );
}

export const logger = crearLogger();
