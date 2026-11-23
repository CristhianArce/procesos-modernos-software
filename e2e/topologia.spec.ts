import { expect, test, type Page } from "@playwright/test";

// Rediseño SCADA (rama ui/scada). Requiere la app levantada con la semilla cargada (npm run seed), que incluye
// db/seed/topologia.sql. Las pruebas devuelven la topología a como estaba.
const PLANTA = "00000000-0000-4000-9000-000000000011";
const HOSPITAL = "00000000-0000-4000-9000-000000000010";

async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}

const topologia = async (page: Page) => (await page.request.get("/api/topologia")).json();
const nodoDelMimico = (page: Page, nombre: string) => page.getByRole("group", { name: "Mímico de la red eléctrica" }).getByRole("button", { name: new RegExp(`^${nombre}`) });

test("ui-scada: CA-4 el administrador mueve un nodo con el teclado, guarda y la posición persiste tras recargar", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  const original = (await topologia(page)).nodos.find((n: { id: string }) => n.id === PLANTA);
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Editar topología" }).click();
  const planta = nodoDelMimico(page, "Planta de Agua La Ayurá");
  await planta.focus();
  for (let i = 0; i < 3; i++) await planta.press("ArrowLeft");
  await page.getByRole("button", { name: "Guardar posiciones (1)" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Posiciones guardadas (1)." })).toBeVisible();

  await page.reload();
  expect((await topologia(page)).nodos.find((n: { id: string }) => n.id === PLANTA)).toMatchObject({ x: original.x - 30, y: original.y });

  const restaurar = await page.request.put(`/api/topologia/nodos/${PLANTA}`, { data: { tipo: original.tipo, x: original.x, y: original.y } });
  expect(restaurar.status()).toBe(200);
});

test("ui-scada: CA-4 el administrador crea un enlace eligiendo dos nodos y lo borra, y los cambios persisten", async ({ page }) => {
  await entrar(page, "admin", "Demo-Admin-2026");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Editar topología" }).click();

  await nodoDelMimico(page, "Hospital General").press("Enter");
  await nodoDelMimico(page, "Planta de Agua La Ayurá").press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Enlace creado: Hospital General → Planta de Agua La Ayurá." })).toBeVisible();
  await page.reload();
  const creado = (await topologia(page)).enlaces.find((e: { origenId: string; destinoId: string }) => e.origenId === HOSPITAL && e.destinoId === PLANTA);
  expect(creado).toBeDefined();

  await page.getByRole("button", { name: "Editar topología" }).click();
  await page.getByRole("button", { name: "Enlace Hospital General → Planta de Agua La Ayurá" }).press("Enter");
  await page.getByRole("button", { name: "Borrar enlace Hospital General → Planta de Agua La Ayurá" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Enlace borrado" })).toBeVisible();
  await page.reload();
  expect((await topologia(page)).enlaces.some((e: { id: string }) => e.id === creado.id)).toBe(false);
});

test("ui-scada: CA-4 el técnico no ve los controles del editor y la API le responde 403", async ({ page }) => {
  await entrar(page, "tecnico", "Demo-Tecnico-2026");
  await page.goto("/dashboard");
  await expect(page.getByRole("group", { name: "Mímico de la red eléctrica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar topología" })).toHaveCount(0);

  expect((await page.request.put(`/api/topologia/nodos/${PLANTA}`, { data: { tipo: "carga", x: 1, y: 1 } })).status()).toBe(403);
  expect((await page.request.post("/api/topologia/enlaces", { data: { origenId: HOSPITAL, destinoId: PLANTA } })).status()).toBe(403);
});
