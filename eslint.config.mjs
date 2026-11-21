import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Nada de console.log suelto (CLAUDE.md §4): se usa src/lib/logger.ts.
  { rules: { "no-console": "error" } },
  // Los scripts de consola sí escriben en la terminal.
  { files: ["scripts/**"], rules: { "no-console": "off" } },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    // Configuración de IA (la prueba node --test) y su worktrees; trabajo del orquestador (CA-7).
    ".claude/**",
    ".flujo/**",
  ]),
]);

export default eslintConfig;
