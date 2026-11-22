import { describe, expect, it } from "vitest";
import { crearLimitador } from "../limitador";

function nuevo() {
  const reloj = { ms: 1_000_000 };
  const limitador = crearLimitador({ ahora: () => reloj.ms });
  return { reloj, limitador };
}

describe("limitador de intentos fallidos", () => {
  it("#20 CA-4: no bloquea con menos de 5 fallos y bloquea al quinto", () => {
    const { limitador } = nuevo();
    for (let i = 0; i < 4; i++) limitador.registrarFallo(["ip:1.1.1.1"]);
    expect(limitador.reintentarEn(["ip:1.1.1.1"])).toBeNull();
    limitador.registrarFallo(["ip:1.1.1.1"]);
    expect(limitador.reintentarEn(["ip:1.1.1.1"])).toBeGreaterThan(0);
  });

  it("#20 CA-4: cuenta por IP y por usuario por separado", () => {
    const { limitador } = nuevo();
    for (let i = 0; i < 5; i++) limitador.registrarFallo([`ip:10.0.0.${i}`, "usuario:ana"]);
    expect(limitador.reintentarEn(["ip:10.0.0.9", "usuario:ana"])).toBeGreaterThan(0); // el usuario acumuló 5
    expect(limitador.reintentarEn(["ip:10.0.0.9", "usuario:luis"])).toBeNull(); // otro usuario desde otra IP libre
    expect(limitador.reintentarEn(["ip:10.0.0.0", "usuario:luis"])).toBeNull(); // esa IP solo acumuló 1
  });

  it("#20 CA-4: informa los segundos hasta que sale el fallo más antiguo de la ventana", () => {
    const { reloj, limitador } = nuevo();
    for (let i = 0; i < 5; i++) {
      limitador.registrarFallo(["ip:2.2.2.2"]);
      reloj.ms += 1_000; // los fallos ocurren a los 0, 1, 2, 3 y 4 segundos
    }
    // ahora son 5 s después del primero: faltan 55 s para que salga
    expect(limitador.reintentarEn(["ip:2.2.2.2"])).toBe(55);
  });

  it("#20 CA-4: libera la clave cuando vence el minuto", () => {
    const { reloj, limitador } = nuevo();
    for (let i = 0; i < 5; i++) limitador.registrarFallo(["ip:3.3.3.3"]);
    expect(limitador.reintentarEn(["ip:3.3.3.3"])).not.toBeNull();
    reloj.ms += 60_000;
    expect(limitador.reintentarEn(["ip:3.3.3.3"])).toBeNull();
  });

  it("#20 CA-4: poda las entradas vencidas para que el mapa no crezca", () => {
    const { reloj, limitador } = nuevo();
    limitador.registrarFallo(["ip:4.4.4.4", "usuario:viejo"]);
    expect(limitador.tamano()).toBe(2);
    reloj.ms += 60_000;
    limitador.registrarFallo(["ip:5.5.5.5"]);
    expect(limitador.tamano()).toBe(1);
  });
});
