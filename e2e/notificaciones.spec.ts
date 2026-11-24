import { expect, test, type Page } from "@playwright/test";

// Requiere la app levantada con la semilla cargada (npm run seed): cuentas del README y db/seed/notificaciones.sql.
async function entrar(page: Page, usuario: string, contrasena: string) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(contrasena);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/$/);
}
const comoAdmin = (page: Page) => entrar(page, "admin", "Demo-Admin-2026");
const comoTecnico = (page: Page) => entrar(page, "tecnico", "Demo-Tecnico-2026");

// Notificaciones de la semilla, de la más reciente a la más antigua.
const SEMILLA = [
  { valor: "131,5 V", magnitud: "voltaje", estado: "Sin leer" },
  { valor: "12,8 A", magnitud: "corriente", estado: "Sin leer" },
  { valor: "1.650 W", magnitud: "potencia", estado: "Sin leer" },
  { valor: "128,2 V", magnitud: "voltaje", estado: "Leída" },
  { valor: "11,4 A", magnitud: "corriente", estado: "Leída" },
];

test("#24 CA-1: el técnico abre Notificaciones, ve el contador y las de la semilla de la más reciente a la más antigua", async ({
  page,
}) => {
  await comoTecnico(page);
  await page.getByRole("link", { name: "Notificaciones", exact: true }).click();
  await expect(page).toHaveURL(/\/notificaciones$/);
  await expect(page.getByRole("heading", { name: "Notificaciones", exact: true })).toBeVisible();
  await expect(page.getByTestId("no-leidas")).toContainText(/\d+ sin leer/);

  const items = page.getByTestId("notificacion");
  const posiciones: number[] = [];
  for (const esperada of SEMILLA) {
    const fila = items
      .filter({ hasText: "Transformador principal" })
      .filter({ hasText: esperada.valor })
      .filter({ hasText: esperada.magnitud })
      .first();
    await expect(fila).toContainText(esperada.estado);
    const textos = await items.allTextContents();
    posiciones.push(
      textos.findIndex(
        (t) => t.includes("Transformador principal") && t.includes(esperada.valor) && t.includes(esperada.magnitud),
      ),
    );
  }
  posiciones.forEach((p) => expect(p).toBeGreaterThanOrEqual(0));
  expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
});

test("#24 CA-3: el administrador no ve la entrada Notificaciones y es redirigido si abre la página", async ({ page }) => {
  await comoAdmin(page);
  await expect(page.getByRole("link", { name: "Nodos", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Notificaciones", exact: true })).toHaveCount(0);

  await page.goto("/notificaciones");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("notificacion")).toHaveCount(0);
});
