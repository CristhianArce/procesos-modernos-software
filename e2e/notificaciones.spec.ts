import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla de la HU 3 y db/seed/notificaciones.sql (4 notificaciones del técnico:
// 2 leídas y 2 sin leer, fechas distintas). La prueba solo lee: no crea ni cambia datos.
async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("#24 CA-1: el técnico abre el centro y ve las notificaciones de la semilla, con el número de no leídas", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/notificaciones");

  await expect(page.getByRole("heading", { name: "Notificaciones", exact: true })).toBeVisible();
  await expect(page.getByTestId("no-leidas")).toHaveText("2");
  await expect(page.getByText("sin leer").first()).toBeVisible();

  // Las cuatro más recientes del técnico son las de la semilla: dos sin leer y dos leídas, cada una con su insignia.
  const filas = page.getByTestId("notificacion");
  await expect(filas.nth(3)).toBeVisible();
  const primeras = [0, 1, 2, 3].map((i) => filas.nth(i));
  let sinLeer = 0;
  let leidas = 0;
  for (const fila of primeras) {
    const texto = (await fila.textContent()) ?? "";
    if (texto.includes("Sin leer")) sinLeer++;
    else if (texto.includes("Leída")) leidas++;
  }
  expect(sinLeer).toBe(2);
  expect(leidas).toBe(2);
});

test("#24 CA-1: el administrador abre /notificaciones y ve que el centro es solo para técnicos", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  await page.goto("/notificaciones");

  await expect(page.getByText("El centro de notificaciones es solo para técnicos")).toBeVisible();
  await expect(page.getByTestId("notificacion")).toHaveCount(0);
});
