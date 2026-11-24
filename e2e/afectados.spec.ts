import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README y el afectado
// «Usuario demo 02» de Subestación Sur. La prueba del nodo vacío crea su propio nodo por la API y lo elimina al terminar.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

const NODO_SUR = "00000000-0000-4000-8000-000000000002";
const creados: string[] = [];

test.afterEach(async ({ page }) => {
  if (creados.length === 0) return;
  await page.context().clearCookies();
  await comoAdmin(page);
  for (const id of creados.splice(0)) await page.request.delete(`/api/nodos/${id}`);
});

const listaAfectados = (page: Page) => page.getByRole("list", { name: "Afectados del nodo" });

test("#25 CA-1: el administrador ve en la ficha de Subestación Sur el panel con el alias Usuario demo 02", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(`/nodos/${NODO_SUR}`);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByTestId("total-afectados")).toBeVisible();
  await expect(listaAfectados(page).getByRole("listitem").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
});

test("#25 CA-2: el técnico ve en la misma ficha el mismo alias y el mismo total que el administrador", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(`/nodos/${NODO_SUR}`);
  await expect(listaAfectados(page).getByRole("listitem").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
  const totalAdmin = (await page.getByTestId("total-afectados").innerText()).trim();
  const aliasAdmin = await listaAfectados(page).getByRole("listitem").allInnerTexts();

  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto(`/nodos/${NODO_SUR}`);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(listaAfectados(page).getByRole("listitem").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
  await expect(page.getByTestId("total-afectados")).toHaveText(totalAdmin);
  expect(await listaAfectados(page).getByRole("listitem").allInnerTexts()).toEqual(aliasAdmin);
});

test("#25 CA-3: la ficha de un nodo sin afectados muestra total 0 y «Sin afectados»", async ({ page }) => {
  await comoAdmin(page);
  const res = await page.request.post("/api/nodos", { data: { nombre: `Nodo afectados e2e ${Date.now()}`, ubicacion: "Laboratorio" } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  creados.push(id);

  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByTestId("total-afectados")).toContainText("0");
  await expect(page.getByText("Sin afectados", { exact: true })).toBeVisible();
});
