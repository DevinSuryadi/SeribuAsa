import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow exports alongside components (needed for shadcn/ui)
      "react-refresh/only-export-components": "off",
      // Allow setState in effects for now (common pattern)
      "react-hooks/set-state-in-effect": "warn",
      // Allow explicit any for rapid development
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);
