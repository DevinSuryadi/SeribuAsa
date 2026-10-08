import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

const REQUIRED_BUILD_VARIABLES = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_API_BASE_URL",
  "VITE_MIDTRANS_CLIENT_KEY",
  "VITE_MIDTRANS_IS_PRODUCTION",
] as const;

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "");
    const missingVariables = REQUIRED_BUILD_VARIABLES.filter((name) => {
      const value = env[name]?.trim();
      return !value || /your-|placeholder|xxxxx/i.test(value);
    });

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing or placeholder production environment variables: ${missingVariables.join(", ")}`
      );
    }

    let apiUrl: URL;
    try {
      apiUrl = new URL(env.VITE_API_BASE_URL);
    } catch {
      throw new Error("VITE_API_BASE_URL must be a valid absolute URL");
    }

    if (apiUrl.protocol !== "https:" || !apiUrl.pathname.replace(/\/$/, "").endsWith("/api/v1")) {
      throw new Error("VITE_API_BASE_URL must use HTTPS and end with /api/v1");
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ["recharts"],
            "date-fns": ["date-fns"],
            supabase: ["@supabase/supabase-js"],
            lucide: ["lucide-react"],
            gsap: ["gsap"],
            jsqr: ["jsqr"],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
  };
});
