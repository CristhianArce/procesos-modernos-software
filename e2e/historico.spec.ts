import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed), que incluye db/seed/historico.sql:
// «Nodo histórico demo» con «Medidor histórico A» (26 lecturas del 2026-01-10 al 2026-01-12, hora de Bogotá) y
// «Medidor histórico B». Solo se afirman filas acotadas por ese nodo y sensor; la prueba no crea ni cambia datos.
const NODO = "Nodo histórico demo";
const SENSOR_A = "Nodo histórico demo · Medidor histórico A";

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

async function filtrar(page: Page, desde: string, hasta: string) {
  const form = page.getByTestId("filtros-historico");
  await form.getByLabel("Nodo", { exact: true }).selectOption({ label: NODO });
  await form.getByLabel("Sensor", { exact: true }).selectOption({ label: SENSOR_A });
  await form.getByLabel("Desde", { exact: true }).fill(desde);
  await form.getByLabel("Hasta", { exact: true }).fill(hasta);
  await form.getByRole("button", { name: "Filtrar", exact: true }).click();
}

async function recorrido(page: Page) {
  await page.getByRole("link", { name: "Histórico", exact: true }).click();
  await expect(page).toHaveURL(/\/historico/);
  await expect(page.getByRole("heading", { name: "Histórico de lecturas", exact: true })).toBeVisible();
  await filtrar(page, "2026-01-10", "2026-01-12");

  const filas = page.getByTestId("lectura-historico");
  await expect(page.getByTestId("tabla-historico")).toBeVisible();
  await expect(filas).toHaveCount(25);
  await expect(page.getByTestId("historico-total")).toHaveText("26");
  await expect(page.getByTestId("historico-pagina")).toContainText("Página 1 de 2");
  await expect(filas.first()).toContainText("Medidor histórico A");
  await expect(filas.first()).toContainText("122,6");
  await expect(filas.last()).toContainText("120,2");
  await expect(page.getByTestId("pagina-anterior")).toHaveCount(0);

  await page.getByTestId("pagina-siguiente").click();
  await expect(page.getByTestId("historico-pagina")).toContainText("Página 2 de 2");
  await expect(filas).toHaveCount(1);
  await expect(filas.first()).toContainText("120,1");
  await expect(page.getByTestId("pagina-siguiente")).toHaveCount(0);
}

test("#26 CA-1 CA-2: el administrador entra por el menú, filtra y recorre las dos páginas", async ({ page }) => {
  await comoAdmin(page);
  await recorrido(page);
});

test("#26 CA-1 CA-2: el técnico ve los mismos resultados", async ({ page }) => {
  await comoTecnico(page);
  await recorrido(page);
});

test("#26 CA-3: un rango sin lecturas muestra el estado vacío y no la tabla", async ({ page }) => {
  await comoAdmin(page);
  await page.goto("/historico");
  await filtrar(page, "2026-02-01", "2026-02-02");

  await expect(page.getByText("No hay lecturas con estos filtros", { exact: true })).toBeVisible();
  await expect(page.getByText("Cambia los filtros o el rango de días.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tabla-historico")).toHaveCount(0);
});

test("#26 CA-4: con desde posterior a hasta muestra filtros inválidos y no la tabla", async ({ page }) => {
  await comoAdmin(page);
  await page.goto("/historico?desde=2026-01-12&hasta=2026-01-10");

  await expect(page.getByText("Filtros inválidos", { exact: true })).toBeVisible();
  await expect(page.getByTestId("tabla-historico")).toHaveCount(0);
  await expect(page.getByTestId("lectura-historico")).toHaveCount(0);
});

test("#26 CA-5: GET /api/historico sin sesión responde 401 en JSON", async ({ request }) => {
  const res = await request.get("/api/historico");
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/json");
});
