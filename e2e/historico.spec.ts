import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Crea su propio nodo y sensor, genera 26 lecturas con POST /api/simulador y los elimina al terminar.
const LECTURAS = 26;
const SENSOR_INEXISTENTE = "00000000-0000-4000-8000-00000000fff1";
const creados: string[] = [];

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");

async function prepararDatos(page: Page) {
  const sufijo = Date.now();
  const nodoNombre = `Nodo histórico e2e ${sufijo}`;
  const sensorNombre = `Sensor histórico e2e ${sufijo}`;
  const nodoRes = await page.request.post("/api/nodos", { data: { nombre: nodoNombre } });
  expect(nodoRes.status()).toBe(201);
  const nodo = await nodoRes.json();
  creados.push(nodo.id);
  const sensorRes = await page.request.post("/api/sensores", { data: { nodoId: nodo.id, nombre: sensorNombre } });
  expect(sensorRes.status()).toBe(201);
  const sensor = await sensorRes.json();
  for (let i = 0; i < LECTURAS; i++) {
    expect((await page.request.post("/api/simulador", { data: { nodoId: nodo.id } })).status()).toBe(200);
  }
  return { nodoId: nodo.id as string, nodoNombre, sensorId: sensor.id as string, sensorNombre };
}

test.afterEach(async ({ page }) => {
  await page.context().clearCookies();
  await comoAdmin(page);
  for (const id of creados.splice(0)) await page.request.delete(`/api/nodos/${id}`);
});

test("#26 CA-1: la primera página muestra 25 lecturas, la segunda al menos 1, de la más reciente a la más antigua", async ({ page }) => {
  await comoAdmin(page);
  const { sensorId, sensorNombre } = await prepararDatos(page);

  await page.goto(`/historico?sensorId=${sensorId}`);
  const filas = page.getByTestId("fila-historico");
  await expect(filas).toHaveCount(25);
  await expect(filas.first()).toContainText(sensorNombre);
  await expect(page.getByTestId("resumen-pagina")).toContainText("Página 1 de");

  await page.goto(`/historico?sensorId=${sensorId}&pagina=2`);
  await expect(page.getByTestId("fila-historico").first()).toContainText(sensorNombre);
  expect(await page.getByTestId("fila-historico").count()).toBeGreaterThanOrEqual(1);

  const res = await page.request.get(`/api/historico?sensorId=${sensorId}`);
  expect(res.status()).toBe(200);
  const cuerpo = await res.json();
  expect(cuerpo.items).toHaveLength(25);
  expect(cuerpo.pagina).toBe(1);
  expect(cuerpo.tamano).toBe(25);
  expect(cuerpo.total).toBeGreaterThanOrEqual(LECTURAS);
  const fechas: number[] = cuerpo.items.map((i: { tomadaEn: string }) => Date.parse(i.tomadaEn));
  for (let i = 1; i < fechas.length; i++) expect(fechas[i - 1]).toBeGreaterThanOrEqual(fechas[i]);
});

test("#26 CA-1: el ítem Histórico del menú lleva a /historico", async ({ page }) => {
  await comoAdmin(page);
  await page.getByRole("link", { name: "Histórico", exact: true }).click();
  await expect(page).toHaveURL(/\/historico$/);
  await expect(page.getByRole("form", { name: "Filtros del histórico" })).toBeVisible();
});

test("#26 CA-2: filtrar por su nodo y luego por su sensor deja solo sus lecturas", async ({ page }) => {
  await comoAdmin(page);
  const { nodoNombre, sensorNombre } = await prepararDatos(page);

  await page.goto("/historico");
  const formulario = page.getByRole("form", { name: "Filtros del histórico" });
  await formulario.getByLabel("Nodo").selectOption({ label: nodoNombre });
  await formulario.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/nodoId=/);
  const filas = page.getByTestId("fila-historico");
  await expect(filas.first()).toContainText(nodoNombre);
  for (const texto of await filas.allTextContents()) expect(texto).toContain(nodoNombre);

  await page.getByRole("form", { name: "Filtros del histórico" }).getByLabel("Sensor").selectOption({ label: sensorNombre });
  await page.getByRole("form", { name: "Filtros del histórico" }).getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/sensorId=/);
  await expect(filas.first()).toContainText(sensorNombre);
  for (const texto of await filas.allTextContents()) expect(texto).toContain(sensorNombre);
});

test("#26 CA-3: un filtro sin coincidencias muestra el estado vacío", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(`/historico?sensorId=${SENSOR_INEXISTENTE}`);
  await expect(page.getByText("No hay lecturas con estos filtros")).toBeVisible();
  await expect(page.getByTestId("fila-historico")).toHaveCount(0);

  const res = await page.request.get(`/api/historico?sensorId=${SENSOR_INEXISTENTE}`);
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ items: [], total: 0 });
});

test("#26 CA-4: una fecha mal formada responde 400 en la API", async ({ page }) => {
  await comoAdmin(page);
  const res = await page.request.get("/api/historico?desde=ayer");
  expect(res.status()).toBe(400);
  expect(res.headers()["content-type"]).toContain("application/json");
});

test("#26 CA-5: la API sin sesión responde 401 en JSON", async ({ request }) => {
  const res = await request.get("/api/historico", { maxRedirects: 0 });
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/json");
});
