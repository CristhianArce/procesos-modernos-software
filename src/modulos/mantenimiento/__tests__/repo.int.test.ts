import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { crear } from "@/modulos/nodos/repo";
import { asignar, buscarUsuario, listarTecnicos, tecnicoDeNodo } from "../repo";

const prefijo = `int-repo-mant-${randomUUID().slice(0, 8)}`;

const crearUsuario = async (sufijo: string, rol: "administrador" | "tecnico"): Promise<{ id: string; nombreUsuario: string }> => {
  const nombreUsuario = `${prefijo}-${sufijo}`;
  const { rows } = await db().query("INSERT INTO usuarios (nombre_usuario, contrasena_hash, rol) VALUES ($1, 'x', $2) RETURNING id", [nombreUsuario, rol]);
  return { id: rows[0].id, nombreUsuario };
};

afterAll(async () => {
  await db().query("DELETE FROM nodos WHERE nombre LIKE $1", [`${prefijo}%`]);
  await db().query("DELETE FROM usuarios WHERE nombre_usuario LIKE $1", [`${prefijo}%`]);
  await db().end();
});

describe("repo de mantenimiento", () => {
  it("#27 CA-1: asignar y luego tecnicoDeNodo devuelve { id, nombreUsuario }", async () => {
    const nodo = await crear({ nombre: `${prefijo}-n1` });
    const tecnico = await crearUsuario("t1", "tecnico");
    await asignar(nodo.id, tecnico.id);
    expect(await tecnicoDeNodo(nodo.id)).toEqual(tecnico);
  });

  it("#27 CA-1: asignar otro técnico reemplaza al anterior y el nodo queda con una sola fila", async () => {
    const nodo = await crear({ nombre: `${prefijo}-n2` });
    const [a, b] = [await crearUsuario("t2a", "tecnico"), await crearUsuario("t2b", "tecnico")];
    await asignar(nodo.id, a.id);
    await asignar(nodo.id, b.id);
    expect(await tecnicoDeNodo(nodo.id)).toEqual(b);
    const { rows } = await db().query("SELECT tecnico_id FROM nodo_tecnicos WHERE nodo_id = $1", [nodo.id]);
    expect(rows).toHaveLength(1);
  });

  it("#27 CA-1: tecnicoDeNodo devuelve null sin asignación", async () => {
    const nodo = await crear({ nombre: `${prefijo}-n3` });
    expect(await tecnicoDeNodo(nodo.id)).toBeNull();
  });

  it("#27 CA-2: buscarUsuario devuelve { id, nombreUsuario, rol } o null", async () => {
    const admin = await crearUsuario("adm", "administrador");
    expect(await buscarUsuario(admin.id)).toEqual({ ...admin, rol: "administrador" });
    expect(await buscarUsuario(randomUUID())).toBeNull();
  });

  it("#27 CA-2: listarTecnicos solo trae técnicos, ordenados por nombre de usuario", async () => {
    const [z, a] = [await crearUsuario("lz", "tecnico"), await crearUsuario("la", "tecnico")];
    const admin = await crearUsuario("ladm", "administrador");
    const lista = await listarTecnicos();
    expect(lista.filter((t) => t.nombreUsuario.startsWith(prefijo))).toEqual([a, z]);
    expect(lista.some((t) => t.id === admin.id)).toBe(false);
  });

  it("#27 CA-1: borrar el nodo borra su asignación", async () => {
    const nodo = await crear({ nombre: `${prefijo}-n4` });
    const tecnico = await crearUsuario("t4", "tecnico");
    await asignar(nodo.id, tecnico.id);
    await db().query("DELETE FROM nodos WHERE id = $1", [nodo.id]);
    const { rows } = await db().query("SELECT 1 FROM nodo_tecnicos WHERE nodo_id = $1", [nodo.id]);
    expect(rows).toHaveLength(0);
  });
});
