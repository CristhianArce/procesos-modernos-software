import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Cada prueba crea su propio nodo por la API y lo elimina al terminar, aunque falle (el borrado en cascada
// elimina sus afectados): solo se afirma sobre el nodo propio.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

const creados: string[] = [];

async function crearNodo(page: Page): Promise<string> {
  const res = await page.request.post("/api/nodos", { data: { nombre: `Nodo afectados e2e ${Date.now()}`, ubicacion: "Laboratorio" } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  creados.push(id);
  return id;
}

test.afterEach(async ({ page }) => {
  await page.context().clearCookies();
  await comoAdmin(page);
  for (const id of creados.splice(0)) await page.request.delete(`/api/nodos/${id}`);
});

test("#54 CA-1: el administrador agrega un afectado desde la ficha, ve el alias y el total 1, y persiste al recargar", async ({ page }) => {
  const alias = `Usuario e2e ${Date.now()}`;
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.goto(`/nodos/${id}`);
  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByTestId("total-afectados")).toContainText("0");

  await page.getByLabel("Alias").fill(alias);
  await page.getByRole("button", { name: "Agregar afectado" }).click();

  await expect(page.getByTestId("lista-afectados")).toContainText(alias);
  await expect(page.getByTestId("total-afectados")).toContainText("1");

  await page.reload();
  await expect(page.getByTestId("lista-afectados")).toContainText(alias);
  await expect(page.getByTestId("total-afectados")).toContainText("1");
});

test("#54 CA-4: el técnico ve la lista y el total pero no el botón de agregar, y su POST responde 403 sin cambiar el total", async ({ page }) => {
  const alias = `Usuario visible e2e ${Date.now()}`;
  await comoAdmin(page);
  const id = await crearNodo(page);
  const alta = await page.request.post("/api/afectados", { data: { nodoId: id, alias } });
  expect(alta.status()).toBe(201);
  await page.context().clearCookies();

  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);
  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByTestId("lista-afectados")).toContainText(alias);
  await expect(page.getByTestId("total-afectados")).toContainText("1");
  await expect(page.getByRole("button", { name: "Agregar afectado" })).toHaveCount(0);

  const res = await page.request.post("/api/afectados", { data: { nodoId: id, alias: `Intruso e2e ${Date.now()}` } });
  expect(res.status()).toBe(403);

  await page.reload();
  await expect(page.getByTestId("lista-afectados")).toContainText(alias);
  await expect(page.getByTestId("lista-afectados")).not.toContainText("Intruso e2e");
  await expect(page.getByTestId("total-afectados")).toContainText("1");
});
