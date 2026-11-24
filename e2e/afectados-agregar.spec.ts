import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada. Cada prueba crea su propio nodo (sin afectados) y lo elimina en afterEach.
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
  const res = await page.request.post("/api/nodos", { data: { nombre: `Nodo agregar afectado e2e ${Date.now()}`, ubicacion: "Laboratorio" } });
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

test("#54 CA-1: el administrador agrega un afectado desde el panel, ve la lista con una entrada, total 1 y persiste al recargar", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  const alias = `Usuario demo ${Date.now()}`;

  await page.goto(`/nodos/${id}`);
  await expect(page.getByText("Este nodo no tiene afectados")).toBeVisible();

  const formulario = page.getByTestId("formulario-afectado");
  await formulario.getByLabel("Alias").fill(alias);
  await formulario.getByRole("button", { name: "Agregar afectado", exact: true }).click();

  const lista = page.getByTestId("afectados-lista");
  await expect(lista).toBeVisible();
  await expect(lista.getByTestId("afectado")).toHaveCount(1);
  await expect(lista.getByTestId("afectado").filter({ hasText: alias })).toHaveCount(1);
  await expect(page.getByTestId("afectados-total")).toHaveText("1");
  await expect(formulario.getByLabel("Alias")).toHaveValue("");

  await page.reload();
  await expect(page.getByTestId("afectados-lista").getByTestId("afectado").filter({ hasText: alias })).toHaveCount(1);
  await expect(page.getByTestId("afectados-total")).toHaveText("1");
});

test("#54 CA-2: si la API rechaza el alias (solo espacios) el panel muestra una alerta y la lista no cambia", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);

  await page.goto(`/nodos/${id}`);
  const formulario = page.getByTestId("formulario-afectado");
  await formulario.getByLabel("Alias").fill("   ");
  await formulario.getByRole("button", { name: "Agregar afectado", exact: true }).click();

  await expect(formulario.getByRole("alert")).toBeVisible();
  await expect(page.getByText("Este nodo no tiene afectados")).toBeVisible();
  await expect(page.getByTestId("afectados-lista")).toHaveCount(0);
});

test("#54 CA-4: el técnico ve el panel sin el formulario y un POST directo devuelve 403 sin cambiar el nodo", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);

  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByText("Este nodo no tiene afectados")).toBeVisible();
  await expect(page.getByTestId("formulario-afectado")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Agregar afectado", exact: true })).toHaveCount(0);

  const res = await page.request.post("/api/afectados", { data: { nodoId: id, alias: `Usuario demo ${Date.now()}` } });
  expect(res.status()).toBe(403);

  await page.reload();
  await expect(page.getByText("Este nodo no tiene afectados")).toBeVisible();
  await expect(page.getByTestId("afectados-lista")).toHaveCount(0);
});
