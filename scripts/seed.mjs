// npm run seed: aplica en orden alfabético los db/seed/*.sql sobre DATABASE_URL, cada uno en una transacción.
// Cada semilla debe ser idempotente (ON CONFLICT DO NOTHING); la HU 2 lo verifica.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const dir = new URL("../db/seed/", import.meta.url);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está definida: cópiala de .env.example a .env o expórtala.");
  process.exit(1);
}

const archivos = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort() : [];
if (archivos.length === 0) {
  console.log("No hay semillas en db/seed/.");
  process.exit(0);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();
try {
  for (const archivo of archivos) {
    await cliente.query("BEGIN");
    try {
      await cliente.query(readFileSync(new URL(archivo, dir), "utf8"));
      await cliente.query("COMMIT");
      console.log(`Semilla aplicada: ${archivo}`);
    } catch (e) {
      await cliente.query("ROLLBACK");
      console.error(`Falló la semilla ${archivo}: ${e.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await cliente.end();
}
