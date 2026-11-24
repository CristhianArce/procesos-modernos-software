import { expect, test } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
test("#20 CA-5: un visitante sin sesión que abre una página del tablero llega a /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
});

test("#20 CA-1: el administrador de demostración entra desde el formulario y ve el tablero", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("admin");
  await page.getByLabel("Contraseña").fill("Demo-Admin-2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Tablero de sensores eléctricos" })).toBeVisible();
});

test("#20 CA-2: unas credenciales incorrectas muestran el mensaje de error y no inician sesión", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("usuario-inexistente-e2e");
  await page.getByLabel("Contraseña").fill("cualquiera");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  // Acotado al formulario: el anunciador de rutas de Next también tiene role="alert".
  await expect(page.locator("form").getByRole("alert")).toHaveText("Credenciales inválidas");
  await expect(page).toHaveURL(/\/login$/);
});

test("#20 CA-7: al cerrar sesión por la API, el tablero vuelve a pedir el login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("tecnico");
  await page.getByLabel("Contraseña").fill("Demo-Tecnico-2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);

  const cierre = await page.request.post("/api/auth/logout");
  expect(cierre.status()).toBe(200);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
