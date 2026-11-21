import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ruta = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// .claude/ (worktrees y pruebas node --test) y .flujo/ quedan fuera (CA-7).
const fuera = ["**/node_modules/**", ".claude/**", ".flujo/**", ".next/**"];

export default defineConfig({
  resolve: {
    alias: {
      "@": ruta("./src"),
      // server-only lanza error fuera de Next; en las pruebas es un módulo vacío.
      "server-only": ruta("./src/test/vacio.ts"),
    },
  },
  test: {
    environment: "node",
    env: { LOG_LEVEL: "silent" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/__tests__/**/*.test.ts"],
          exclude: [...fuera, "**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/__tests__/**/*.int.test.ts"],
          exclude: fuera,
        },
      },
    ],
  },
});
