import { acercaSchema, type Acerca } from "./schema";

// RN-1: el contenido es fijo en el código del módulo; no se guarda en la BD.
const ACERCA = acercaSchema.parse({
  nombre: "Tablero de sensores eléctricos",
  version: "0.1.0",
});

export function obtenerAcerca(): Acerca {
  return ACERCA;
}
