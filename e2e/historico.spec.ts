import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed), incluida db/seed/historico.sql.
// La prueba solo lee: acota todo con el nodo de la semilla y un rango de marzo de 2026.
const NODO = "00000000-0000-4000-8000-000000000301";
const SENSOR_1 = "00000000-0000-4000-8000-000000000311";
const DESDE = "2026-03-01T00:00:00Z";
const HASTA = "2026-03-31T23:59:59Z";
const FILTROS_MARZO = `nodoId=${NODO}&desde=${DESDE}&hasta=${HASTA}`;

type Item = { sensorNombre: string; nodoNombre: string; tomadaEn: string };

async function comoTecnico(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("tecnico");
  await page.getByLabel("Contraseña").fill("Demo-Tecnico-2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("#26 CA-1: la página 1 muestra 25 lecturas, la 2 una, la más reciente primero", async ({ page }) => {
  await comoTecnico(page);
  const api1 = await page.request.get(`/api/historico?${FILTROS_MARZO}`);
  expect(api1.status()).toBe(200);
  const cuerpo1 = await api1.json();
  expect(cuerpo1.total).toBe(26);
  const items1: Item[] = cuerpo1.items;
  expect(items1).toHaveLength(25);
  const fechas = items1.map((i) => Date.parse(i.tomadaEn));
  expect(fechas).toEqual([...fechas].sort((a, b) => b - a));

  await page.goto(`/historico?${FILTROS_MARZO}`);
  const filas = page.getByTestId("fila-lectura");
  await expect(filas).toHaveCount(25);
  await expect(filas.first()).toContainText(items1[0].nodoNombre);
  await expect(filas.first()).toContainText(items1[0].sensorNombre);
  const paginador = page.getByRole("navigation", { name: "Paginación del histórico" });
  await expect(paginador.getByTestId("pagina-actual")).toContainText("Página 1 de 2");
  await expect(paginador.getByTestId("total-historico")).toContainText("26 lecturas");

  const api2 = await page.request.get(`/api/historico?${FILTROS_MARZO}&pagina=2`);
  const items2: Item[] = (await api2.json()).items;
  expect(items2).toHaveLength(1);
  expect(Date.parse(items2[0].tomadaEn)).toBeLessThanOrEqual(fechas[24]);

  await paginador.getByRole("link", { name: "Siguiente" }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(filas).toHaveCount(1);
  await expect(filas.first()).toContainText(items2[0].sensorNombre);
  await expect(page.getByTestId("pagina-actual")).toContainText("Página 2 de 2");
});

test("#26 CA-2: añadir el sensor reduce la lista a sus lecturas", async ({ page }) => {
  await comoTecnico(page);
  await page.goto(`/historico?${FILTROS_MARZO}`);
  await expect(page.getByTestId("total-historico")).toContainText("26 lecturas");

  await page.getByLabel("Sensor").selectOption(SENSOR_1);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();

  await expect(page).toHaveURL(new RegExp(`sensorId=${SENSOR_1}`));
  await expect(page.getByTestId("total-historico")).toContainText("24 lecturas");
  await expect(page.getByTestId("fila-lectura")).toHaveCount(24);
  await expect(page.getByLabel("Sensor")).toHaveValue(SENSOR_1);
  await expect(page.getByLabel("Nodo")).toHaveValue(NODO);
});

test("#26 CA-3: un rango sin lecturas muestra Sin lecturas", async ({ page }) => {
  await comoTecnico(page);
  await page.goto(`/historico?nodoId=${NODO}&desde=2026-03-10T00:00:00Z&hasta=2026-03-10T00:00:01Z`);
  // El formulario existe, así que la página cargó; luego se afirma el vacío.
  await expect(page.getByRole("button", { name: "Aplicar filtros" })).toBeVisible();
  await expect(page.getByText("Sin lecturas")).toBeVisible();
  await expect(page.getByTestId("fila-lectura")).toHaveCount(0);

  const api = await page.request.get(`/api/historico?nodoId=${NODO}&desde=2020-01-01T00:00:00Z&hasta=2020-01-02T00:00:00Z`);
  expect(api.status()).toBe(200);
  const cuerpo = await api.json();
  expect(cuerpo.items).toEqual([]);
  expect(cuerpo.total).toBe(0);
});

test("#26 CA-4: desde=ayer responde 400 en la API y la página muestra el error", async ({ page }) => {
  await comoTecnico(page);
  const api = await page.request.get("/api/historico?desde=ayer");
  expect(api.status()).toBe(400);

  await page.goto("/historico?desde=ayer");
  await expect(page.getByRole("heading", { name: "Filtros no válidos", exact: true })).toBeVisible();
  await expect(page.getByTestId("fila-lectura")).toHaveCount(0);
});

test("#26 CA-5: la API sin sesión responde 401 en JSON", async ({ request }) => {
  const res = await request.get("/api/historico");
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(await res.json()).toHaveProperty("error");
});
