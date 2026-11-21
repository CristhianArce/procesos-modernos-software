import { describe, expect, it } from "vitest";
import { crearGetAcerca, type Sesion } from "../handler";

const peticion = () => new Request("http://localhost/api/acerca");
const conSesion = (sesion: Sesion | null) => () => sesion;

describe("GET /api/acerca", () => {
  it("#6 CA-1: responde 200 con nombre y version a un administrador", async () => {
    const respuesta = await crearGetAcerca(conSesion({ rol: "administrador" }))(peticion());

    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.nombre).toBeTruthy();
    expect(cuerpo.version).toBeTruthy();
  });

  it("#6 CA-1: responde 200 con nombre y version a un técnico", async () => {
    const respuesta = await crearGetAcerca(conSesion({ rol: "tecnico" }))(peticion());

    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.nombre).toBeTruthy();
    expect(cuerpo.version).toBeTruthy();
  });

  it("#6 CA-3: responde 401 con JSON de error sin sesión", async () => {
    const respuesta = await crearGetAcerca(conSesion(null))(peticion());

    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get("content-type")).toContain("application/json");
    const cuerpo = await respuesta.json();
    expect(cuerpo.error).toBeTruthy();
    expect(cuerpo).not.toHaveProperty("nombre");
    expect(cuerpo).not.toHaveProperty("version");
  });
});
