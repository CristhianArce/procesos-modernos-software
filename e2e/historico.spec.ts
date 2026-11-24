import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README.
// Cada prueba crea su propio nodo, sensor y lecturas por la API y elimina el nodo al terminar, aunque falle.
// Las afirmaciones se acotan al nodo propio (selector «Nodo»): no se cuenta nada de la semilla ni del simulador.

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

const nodosCreados: string[] = [];

async function crearNodoConLecturas(page: Page, cuantas: number) {
  const sufijo = Date.now();
  const nombreNodo = `Nodo histórico e2e ${sufijo}`;
  const nombreSensor = `Sensor histórico e2e ${sufijo}`;
  const resNodo = await page.request.post("/api/nodos", { data: { nombre: nombreNodo, ubicacion: "Laboratorio" } });
  expect(resNodo.status()).toBe(201);
  const { id: nodoId } = await resNodo.json();
  nodosCreados.push(nodoId);
  const resSensor = await page.request.post("/api/sensores", { data: { nodoId, nombre: nombreSensor } });
  expect(resSensor.status()).toBe(201);
  for (let i = 0; i < cuantas; i++) {
    const res = await page.request.post("/api/simulador", { data: { nodoId } });
    expect(res.status()).toBe(200);
  }
  return { nodoId, nombreNodo, nombreSensor };
}

test.afterEach(async ({ page }) => {
  await page.context().clearCookies();
  await comoAdmin(page);
  for (const id of nodosCreados.splice(0)) await page.request.delete(`/api/nodos/${id}`);
});

const filas = (page: Page) => page.getByTestId("fila-historico");
const aplicar = (page: Page) => page.getByRole("button", { name: "Aplicar filtros", exact: true });

async function filtrarPorNodo(page: Page, nombreNodo: string) {
  await page.getByLabel("Nodo", { exact: true }).selectOption({ label: nombreNodo });
  await aplicar(page).click();
}

test("#26 CA-1: la primera página del nodo propio trae 25 filas y la segunda la lectura restante", async ({ page }) => {
  await comoAdmin(page);
  const { nombreNodo, nombreSensor } = await crearNodoConLecturas(page, 26);
  await page.goto("/historico");
  await filtrarPorNodo(page, nombreNodo);

  await expect(filas(page)).toHaveCount(25);
  await expect(filas(page).first()).toContainText(nombreSensor);
  await expect(filas(page).first()).toContainText(nombreNodo);

  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(filas(page)).toHaveCount(1);
  await expect(filas(page).first()).toContainText(nombreSensor);
});

test("#26 CA-2: el técnico filtra por el nodo propio con el teclado y solo ve filas de ese nodo", async ({ page }) => {
  await comoAdmin(page);
  const { nombreNodo } = await crearNodoConLecturas(page, 3);
  await page.context().clearCookies();
  await comoTecnico(page);
  await page.goto("/historico");

  await page.getByLabel("Nodo", { exact: true }).selectOption({ label: nombreNodo });
  await aplicar(page).focus();
  await page.keyboard.press("Enter");

  await expect(filas(page)).toHaveCount(3);
  for (const texto of await filas(page).allTextContents()) expect(texto).toContain(nombreNodo);
});

test("#26 CA-2: un rango de fechas amplio acotado al nodo propio devuelve sus lecturas", async ({ page }) => {
  await comoAdmin(page);
  const { nombreNodo } = await crearNodoConLecturas(page, 2);
  await page.goto("/historico");

  await page.getByLabel("Nodo", { exact: true }).selectOption({ label: nombreNodo });
  await page.getByLabel("Desde", { exact: true }).fill("2000-01-01T00:00");
  await page.getByLabel("Hasta", { exact: true }).fill("2100-01-01T00:00");
  await aplicar(page).click();

  await expect(filas(page)).toHaveCount(2);
});

test("#26 CA-3: un filtro sin resultados muestra el estado vacío en lugar de la tabla", async ({ page }) => {
  await comoAdmin(page);
  const { nombreNodo } = await crearNodoConLecturas(page, 2);
  await page.goto("/historico");
  await filtrarPorNodo(page, nombreNodo);
  await expect(filas(page)).toHaveCount(2);

  await page.getByLabel("Desde", { exact: true }).fill("2000-01-01T00:00");
  await page.getByLabel("Hasta", { exact: true }).fill("2000-01-02T00:00");
  await aplicar(page).click();

  await expect(page.getByTestId("historico-vacio")).toBeVisible();
  await expect(filas(page)).toHaveCount(0);
});

test("#26 CA-5: sin sesión, /historico redirige al login y la API responde 401 en JSON", async ({ page }) => {
  await page.goto("/historico");
  await expect(page).toHaveURL(/\/login/);

  const res = await page.request.get("/api/historico");
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/json");
});
