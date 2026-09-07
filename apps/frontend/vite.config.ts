import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
