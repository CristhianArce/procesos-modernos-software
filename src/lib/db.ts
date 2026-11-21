import "server-only";
import { Pool } from "pg";

let pool: Pool | undefined;

/** Pool perezoso: importar este módulo no abre conexiones. Solo los repo.ts lo usan (CLAUDE.md §4). */
export function db(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida");
  return (pool ??= new Pool({ connectionString: url }));
}
