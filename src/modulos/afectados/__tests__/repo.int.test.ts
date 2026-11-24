import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listarPorNodo } from "../repo";

const prefijo = `int-repo-afectados-${randomUUID().slice(0, 8)}`;
let conDatos: string;
let otro: string;
let vacio: string;
let paraBorrar: string;
const idMenor = "00000000-0000-4000-8000-0000000000a1";
const idMayor = "00000000-0000-4000-8000-0000000000a2";

beforeAll(async () => {
  const q = (sql: string, p: unknown[]) => db().query(sql, p).then((r) => r.rows);
  [conDatos, otro, vacio, paraBorrar] = (await q("INSERT INTO nodos (nombre) VALUES ($1), ($1), ($1), ($1) RETURNING id", [prefijo])).map((f) => f.id);
  await q(
    `INSERT INTO nodo_usuarios (id, nodo_id, alias) VALUES
       ($2, $1, 'Beta ${prefijo}'),
       ($3, $1, 'Beta ${prefijo}'),
       (gen_random_uuid(), $1, 'Alfa ${prefijo}'),
       (gen_random_uuid(), $4, 'Ajeno ${prefijo}')`,
    [conDatos, idMayor, idMenor, otro],
  );
  await q("INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, 'Efimero')", [paraBorrar]);
});

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre = $1", [prefijo]);
  await db().end();
});

describe("repo de afectados", () => {
  it("#25 CA-1: lista { id, alias } ordenados por alias y, con alias repetidos, por id", async () => {
    const lista = await listarPorNodo(conDatos);
    expect(lista.map((a) => a.alias)).toEqual([`Alfa ${prefijo}`, `Beta ${prefijo}`, `Beta ${prefijo}`]);
    expect(lista.slice(1).map((a) => a.id)).toEqual([idMenor, idMayor]);
    expect(Object.keys(lista[0]).sort()).toEqual(["alias", "id"]);
  });

  it("#25 CA-1: no incluye afectados de otro nodo", async () => {
    const lista = await listarPorNodo(conDatos);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.map((a) => a.alias)).not.toContain(`Ajeno ${prefijo}`);
    expect((await listarPorNodo(otro)).map((a) => a.alias)).toEqual([`Ajeno ${prefijo}`]);
  });

  it("#25 CA-3: un nodo sin afectados devuelve una lista vacía", async () => {
    expect(await listarPorNodo(vacio)).toEqual([]);
  });

  it("#25 CA-3: eliminar el nodo elimina sus afectados", async () => {
    const antes = await db().query("SELECT 1 FROM nodo_usuarios WHERE nodo_id = $1", [paraBorrar]);
    expect(antes.rowCount).toBe(1);
    await db().query("DELETE FROM nodos WHERE id = $1", [paraBorrar]);
    const despues = await db().query("SELECT 1 FROM nodo_usuarios WHERE nodo_id = $1", [paraBorrar]);
    expect(despues.rowCount).toBe(0);
  });

  it("#25 CA-1: un alias vacío viola el CHECK", async () => {
    await expect(db().query("INSERT INTO nodo_usuarios (nodo_id, alias) VALUES ($1, '   ')", [vacio])).rejects.toThrow();
  });
});
