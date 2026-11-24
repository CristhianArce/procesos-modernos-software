import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Cada prueba crea su propio nodo por la API y lo elimina al terminar, aunque falle: un nodo aislado que quedara
// en la base cambiaría lo que cuentan otras pruebas, como el mímico del dashboard (decisión #8).

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
  const res = await page.request.post("/api/nodos", { data: { nombre: `Nodo aislamiento e2e ${Date.now()}`, ubicacion: "Laboratorio" } });
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

// El indicador «Conexión» de la ficha; el del encabezado muestra el nivel de las lecturas y también puede decir «Desconectado».
const conexion = (page: Page) => page.locator("dt", { hasText: "Conexión" }).locator("xpath=following-sibling::dd");

test("#23 CA-1: el administrador aísla un nodo, la ficha lo muestra desconectado sin recargar y persiste", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.goto(`/nodos/${id}`);
  await expect(conexion(page)).toContainText("Conectado");
  await page.evaluate(() => ((window as unknown as { marca: number }).marca = 1)); // se pierde si la página se recarga

  await page.getByRole("button", { name: "Aislar nodo" }).click();
  await expect(page.getByText("¿Aislar este nodo?")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar" }).click();

  await expect(conexion(page)).toContainText("Desconectado");
  await expect(page.getByRole("button", { name: "Reconectar nodo" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { marca?: number }).marca)).toBe(1);

  await page.reload();
  await expect(conexion(page)).toContainText("Desconectado");
});

test("#23 CA-2: el administrador reconecta un nodo desconectado y vuelve a conectado", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.request.patch(`/api/aislamiento/nodos/${id}`, { data: { estado: "desconectado" } });
  await page.goto(`/nodos/${id}`);
  await expect(conexion(page)).toContainText("Desconectado");

  await page.getByRole("button", { name: "Reconectar nodo" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();

  await expect(conexion(page)).toContainText("Conectado");
  await expect(page.getByRole("button", { name: "Aislar nodo" })).toBeVisible();
  await page.reload();
  await expect(conexion(page)).toContainText("Conectado");
});

test("#23 CA-1: cancelar la confirmación no cambia el estado del nodo", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.goto(`/nodos/${id}`);

  await page.getByRole("button", { name: "Aislar nodo" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();

  await expect(page.getByRole("button", { name: "Confirmar" })).toHaveCount(0);
  await expect(conexion(page)).toContainText("Conectado");
});

test("#23 CA-3: el técnico no ve los botones de aislar ni reconectar y la API le responde 403", async ({ page }) => {
  await comoAdmin(page);
  const id = await crearNodo(page);
  await page.context().clearCookies();

  await comoTecnico(page);
  await page.goto(`/nodos/${id}`);
  await expect(page.getByRole("heading", { name: "Aislamiento", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aislar nodo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reconectar nodo" })).toHaveCount(0);

  const res = await page.request.patch(`/api/aislamiento/nodos/${id}`, { data: { estado: "desconectado" } });
  expect(res.status()).toBe(403);
  await page.reload();
  await expect(conexion(page)).toContainText("Conectado");
});

test("#23 CA-4: cambiar el estado de un nodo que no existe responde 404", async ({ page }) => {
  await comoAdmin(page);
  const res = await page.request.patch("/api/aislamiento/nodos/00000000-0000-4000-8000-00000000ffff", { data: { estado: "desconectado" } });
  expect(res.status()).toBe(404);
});
