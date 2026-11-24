import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README y db/seed/notificaciones.sql.
// Solo lee: no crea ni cambia datos. Afirma el orden y el contenido de filas concretas de la semilla, nunca el total de filas.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("#24 CA-1: el técnico ve las notificaciones de la semilla, la más reciente primero, con el número de no leídas", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.getByRole("link", { name: "Notificaciones", exact: true }).click();
  await expect(page).toHaveURL(/\/notificaciones$/);

  const filas = page.getByTestId("notificacion");
  const tension131 = filas.filter({ hasText: /131[,.]4/ });
  const tension128 = filas.filter({ hasText: /128[,.]9/ });
  const potencia = filas.filter({ hasText: "Sensor de potencia S3" });
  const corriente = filas.filter({ hasText: "Sensor de corriente S2" });

  await expect(tension128.first()).toContainText("Sensor de tensión S1");
  await expect(potencia.first()).toContainText(/2[,.]15/);
  await expect(corriente.first()).toContainText(/17[,.]2/);
  await expect(tension131.first()).toContainText("Sensor de tensión S1");

  // Orden de la semilla: 128,9 V, 2,15 kW, 17,2 A, 131,4 V (de más reciente a más antigua).
  const textos = await filas.allTextContents();
  const posicion = (patron: RegExp) => textos.findIndex((t) => patron.test(t));
  const p2404 = posicion(/128[,.]9/);
  const p2403 = posicion(/Sensor de potencia S3/);
  const p2402 = posicion(/Sensor de corriente S2/);
  const p2401 = posicion(/131[,.]4/);
  expect(p2404).toBeGreaterThanOrEqual(0);
  expect(p2404).toBeLessThan(p2403);
  expect(p2403).toBeLessThan(p2402);
  expect(p2402).toBeLessThan(p2401);

  // La leída de la semilla (131,4 V) no lleva «No leída»; las otras tres sí.
  await expect(tension131.first()).toHaveAttribute("data-leida", "true");
  await expect(tension131.first()).not.toContainText("No leída");
  for (const fila of [tension128, potencia, corriente]) {
    await expect(fila.first()).toHaveAttribute("data-leida", "false");
    await expect(fila.first()).toContainText("No leída");
  }

  // El número de no leídas cuenta al menos las tres de la semilla (no se afirma el total exacto).
  const texto = (await page.getByTestId("no-leidas").textContent()) ?? "";
  const match = /No leídas:\s*(\d+)/.exec(texto);
  expect(match).not.toBeNull();
  expect(Number(match![1])).toBeGreaterThanOrEqual(3);
});

test("#24 CA-3: sin sesión la página del centro lleva al login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/notificaciones");
  await expect(page).toHaveURL(/\/login/);
});
