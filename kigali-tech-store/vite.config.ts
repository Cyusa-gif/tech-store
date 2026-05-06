import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Local dev: forward /api/* to the local Express server.
      // Production: calls are same-origin and handled by Vercel API routes.
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
    host: true,
  },
});
