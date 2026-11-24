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

  // Se afirma el orden y el contenido de las filas de la semilla, no cuántas filas hay en total: otra historia
  // o prueba puede agregar notificaciones al técnico. Cada fila de la semilla se identifica por su sensor y su valor.
  const filas = page.getByTestId("notificacion");
  const deLaSemilla = [
    { sensor: "Sensor de tensión S1", valor: "128,9 V" },
    { sensor: "Sensor de potencia S3", valor: "2,15 kW" },
    { sensor: "Sensor de corriente S2", valor: "17,2 A" },
    { sensor: "Sensor de tensión S1", valor: "131,4 V" },
  ];
  await expect(filas.first()).toBeVisible();
  const textos = await filas.allInnerTexts();
  const posiciones = deLaSemilla.map(({ sensor, valor }) => textos.findIndex((t) => t.includes(sensor) && t.includes(valor)));
  expect(posiciones.every((p) => p >= 0)).toBe(true);
  expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b));

  // La más antigua de la semilla está leída (sin insignia) y las demás no.
  const antigua = filas.filter({ hasText: "131,4 V" });
  await expect(antigua).toHaveAttribute("data-leida", "true");
  await expect(antigua).not.toContainText("No leída");
  await expect(filas.filter({ hasText: "128,9 V" })).toContainText("No leída");
  await expect(page.getByTestId("no-leidas")).toHaveText(/^No leídas: \d+$/);
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
