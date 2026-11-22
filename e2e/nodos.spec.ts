import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README y nodos de demostración.
const NODO_SEMILLA = "/nodos/00000000-0000-4000-8000-000000000001";

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

test("#21 CA-1: el administrador crea un nodo desde /nodos y lo ve en la lista como conectado", async ({ page }) => {
  const nombre = `Nodo e2e ${Date.now()}`;
  await comoAdmin(page);
  await page.getByRole("link", { name: "Nodos" }).click();
  await expect(page).toHaveURL(/\/nodos$/);

  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Ubicación").fill("Laboratorio");
  await page.getByRole("button", { name: "Crear nodo" }).click();

  const fila = page.getByRole("row", { name: new RegExp(nombre) });
  await expect(fila).toContainText("Laboratorio");
  await expect(fila).toContainText("conectado");
});

test("#21 CA-7: la ficha de un nodo de la semilla muestra sus datos, sus sensores y los paneles", async ({ page }) => {
  await comoTecnico(page);
  await page.goto(NODO_SEMILLA);

  await expect(page.getByRole("heading", { name: "Subestación Norte" })).toBeVisible();
  await expect(page.getByText("Bello, Antioquia")).toBeVisible();
  await expect(page.getByText("conectado")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sensores" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Simulador" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Transformador principal/ })).toContainText("125 V");
  await expect(page.getByRole("row", { name: /Línea de respaldo/ })).toBeVisible();
});

test("#21 CA-2: el administrador agrega un sensor desde la ficha y aparece en ella", async ({ page }) => {
  const nombre = `Sensor e2e ${Date.now()}`;
  await comoAdmin(page);
  await page.goto(NODO_SEMILLA);

  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Umbral de voltaje (V)").fill("126");
  await page.getByRole("button", { name: "Agregar sensor" }).click();

  const fila = page.getByRole("row", { name: new RegExp(nombre) });
  await expect(fila).toContainText("126 V");
  await expect(fila).toContainText("Sin lecturas");
});

test("#21 CA-6: al pulsar Simular lecturas, cada sensor del nodo muestra una lectura nueva", async ({ page }) => {
  await comoAdmin(page);
  await page.goto(NODO_SEMILLA);
  const lecturas = page.getByTestId("ultima-lectura");
  const antes = await lecturas.allTextContents();
  expect(antes.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Simular lecturas" }).click();

  await expect(async () => {
    const despues = await lecturas.allTextContents();
    expect(despues).toHaveLength(antes.length);
    despues.forEach((texto, i) => {
      expect(texto).not.toBe(antes[i]);
      expect(texto).toMatch(/V · .* A · .* W/);
    });
  }).toPass();
});

test("#21 CA-5: el técnico ve la lista y la ficha, sin formularios ni botón de simular", async ({ page }) => {
  await comoTecnico(page);
  await page.goto("/nodos");
  await expect(page.getByRole("link", { name: "Subestación Norte" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear nodo" })).toHaveCount(0);

  await page.getByRole("link", { name: "Subestación Norte" }).click();
  await expect(page.getByRole("heading", { name: "Sensores" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar sensor" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Simular lecturas" })).toHaveCount(0);

  const res = await page.request.post("/api/nodos", { data: { nombre: "Nodo del técnico" } });
  expect(res.status()).toBe(403);
});

test("#21 CA-4: la ficha de un nodo que no existe responde no encontrado", async ({ page }) => {
  await comoTecnico(page);
  const res = await page.goto("/nodos/00000000-0000-4000-8000-00000000ffff");
  expect(res?.status()).toBe(404);
});
