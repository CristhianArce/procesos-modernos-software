import "server-only";
import type { Pool as TipoPool } from "pg";

// pg con require (externo CommonJS, síncrono) y no con import: como externo ESM, Turbopack lo carga de forma
// asíncrona, todo lo que llega a la BD se vuelve un módulo asíncrono y el registro de extensiones (import.meta.glob
// eager) recibe vacío el paneles.ts de esos módulos. Así el panel Sensores no salía en la ficha del nodo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool }: typeof import("pg") = require("pg");

let pool: TipoPool | undefined;

/** Pool perezoso: importar este módulo no abre conexiones. Solo los repo.ts lo usan (CLAUDE.md §4). */
export function db(): TipoPool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida");
  return (pool ??= new Pool({ connectionString: url }));
}
