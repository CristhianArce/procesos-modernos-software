import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Solo lee: no crea ni cambia datos, así que no necesita limpieza.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("#24 CA-1: el técnico ve las notificaciones de la semilla, la más reciente primero, con el número de no leídas", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/notificaciones");

  const filas = page.getByTestId("notificacion");
  await expect(filas).toHaveCount(4);
  await expect(filas.nth(0)).toContainText("Sensor de tensión S1");
  await expect(filas.nth(0)).toContainText("128,9 V");
  await expect(filas.nth(1)).toContainText("Sensor de potencia S3");
  await expect(filas.nth(1)).toContainText("2,15 kW");
  await expect(filas.nth(2)).toContainText("Sensor de corriente S2");
  await expect(filas.nth(2)).toContainText("17,2 A");
  await expect(filas.nth(3)).toContainText("131,4 V");
  await expect(filas.nth(3)).toHaveAttribute("data-leida", "true");
  await expect(page.locator('[data-testid="notificacion"][data-leida="false"]')).toHaveCount(3);
  await expect(page.getByTestId("no-leidas")).toHaveText("No leídas: 3");
});

test("#24 CA-3: el administrador no ve Notificaciones en el menú y la API le responde 403", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  await expect(page.getByRole("link", { name: "Notificaciones", exact: true })).toHaveCount(0);
  const res = await page.request.get("/api/notificaciones");
  expect(res.status()).toBe(403);
});

test("#24 CA-3: sin sesión la página lleva al login y la API responde 401", async ({ page }) => {
  await page.goto("/notificaciones");
  await expect(page).toHaveURL(/\/login/);
  const res = await page.request.get("/api/notificaciones");
  expect(res.status()).toBe(401);
});
