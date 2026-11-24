import { describe, expect, it } from "vitest";
import { idNotificacionSchema } from "../schema";

describe("idNotificacionSchema", () => {
  it("#53 CA-4: acepta un UUID 8-4-4-4-12 aunque no sea v4", () => {
    const id = "00000000-0000-0000-0000-000000000001";
    expect(idNotificacionSchema.safeParse({ id }).success).toBe(true);
    const v4 = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b";
    expect(idNotificacionSchema.safeParse({ id: v4 }).success).toBe(true);
  });

  it("#53 CA-4: rechaza un texto que no es UUID", () => {
    expect(idNotificacionSchema.safeParse({ id: "no-es-un-uuid" }).success).toBe(false);
  });

  it("#53 CA-4: rechaza la cadena vacía", () => {
    expect(idNotificacionSchema.safeParse({ id: "" }).success).toBe(false);
  });

  it("#53 CA-4: rechaza un UUID sin guiones", () => {
    expect(
      idNotificacionSchema.safeParse({ id: "3f2b8c1e5a4d4e6f9a1b2c3d4e5f6a7b" }).success,
    ).toBe(false);
  });
});
