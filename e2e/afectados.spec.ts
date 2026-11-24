import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed), que incluye db/seed/nodos_usuarios.sql:
// «Usuario demo 02» es afectado de «Subestación Sur». No se afirma el total de la semilla (otras historias pueden
// agregar afectados a ese nodo): se afirma que el total coincide con las filas pintadas y el contenido de la fila propia.
const NODO_SUR = "/nodos/00000000-0000-4000-8000-000000000002";

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

async function leerPanel(page: Page) {
  const lista = page.getByTestId("afectados-lista");
  await expect(lista).toBeVisible();
  const alias = await lista.getByTestId("afectado").allTextContents();
  const total = Number((await page.getByTestId("afectados-total").textContent())?.trim());
  return { alias: alias.map((a) => a.trim()), total };
}

test("#25 CA-1 CA-2: el administrador ve en la ficha de Subestación Sur el panel Afectados con su total y sus alias", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(NODO_SUR);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByText("Total de afectados")).toBeVisible();
  await expect(page.getByTestId("afectado").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
  const { alias, total } = await leerPanel(page);
  expect(total).toBe(alias.length);
  expect(alias).toContain("Usuario demo 02");
});

test("#25 CA-2: el técnico ve la misma lista y el mismo total que el administrador", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(NODO_SUR);
  await expect(page.getByTestId("afectado").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
  const delAdmin = await leerPanel(page);

  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto(NODO_SUR);
  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByTestId("afectado").filter({ hasText: "Usuario demo 02" })).toHaveCount(1);
  expect(await leerPanel(page)).toEqual(delAdmin);
});

test("#25 CA-1 CA-3: el técnico abre un nodo sin afectados y ve el estado vacío sin lista", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);

  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);

  await expect(page.getByRole("heading", { name: "Afectados", exact: true })).toBeVisible();
  await expect(page.getByText("Este nodo no tiene afectados")).toBeVisible();
  await expect(page.getByTestId("afectados-lista")).toHaveCount(0);
});
