import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Cada prueba crea su propio nodo por la API y lo elimina al terminar, aunque falle.

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
  const res = await page.request.post("/api/nodos", { data: { nombre: `Nodo mantenimiento e2e ${Date.now()}`, ubicacion: "Laboratorio" } });
  expect(res.status()).toBe(201);
  const { id } = await res.json();
  creados.push(id);
  return id;
}

async function asignarDesdeLaFicha(page: Page, id: string) {
  await page.goto(`/nodos/${id}`);
  await page.getByTestId("selector-tecnico").selectOption({ label: "tecnico" });
  await page.getByRole("button", { name: "Asignar", exact: true }).click();
  await expect(page.getByTestId("tecnico-asignado")).toContainText("tecnico");
}

test.afterEach(async ({ page }) => {
  await page.context().clearCookies();
  await comoAdmin(page);
  for (const id of creados.splice(0)) await page.request.delete(`/api/nodos/${id}`);
});

test("#27 CA-1: el administrador asigna un técnico, la ficha lo muestra sin recargar y persiste", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.goto(`/nodos/${id}`);
  await expect(page.getByText("Sin técnico asignado", { exact: true })).toBeVisible();
  await page.evaluate(() => ((window as unknown as { marca: number }).marca = 1)); // se pierde si la página se recarga

  await page.getByTestId("selector-tecnico").selectOption({ label: "tecnico" });
  await page.getByRole("button", { name: "Asignar", exact: true }).click();

  await expect(page.getByTestId("tecnico-asignado")).toContainText("tecnico");
  expect(await page.evaluate(() => (window as unknown as { marca?: number }).marca)).toBe(1);

  await page.reload();
  await expect(page.getByTestId("tecnico-asignado")).toContainText("tecnico");
});

test("#27 CA-4: el técnico ve el técnico asignado, no ve el selector y la API le responde 403", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await asignarDesdeLaFicha(page, id);
  await page.context().clearCookies();

  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);
  await expect(page.getByTestId("tecnico-asignado")).toContainText("tecnico");
  await expect(page.getByTestId("selector-tecnico")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Asignar", exact: true })).toHaveCount(0);

  const res = await page.request.put(`/api/mantenimiento/nodos/${id}/tecnico`, {
    data: { tecnicoId: "00000000-0000-4000-8000-00000000aaaa" },
  });
  expect(res.status()).toBe(403);
  await page.reload();
  await expect(page.getByTestId("tecnico-asignado")).toContainText("tecnico");
});

test("#27 CA-3: asignar un técnico a un nodo que no existe responde 404", async ({ page }) => {
  await comoAdmin(page);
  const res = await page.request.put("/api/mantenimiento/nodos/00000000-0000-4000-8000-00000000ffff/tecnico", {
    data: { tecnicoId: "00000000-0000-4000-8000-00000000aaaa" },
  });
  expect(res.status()).toBe(404);
});
