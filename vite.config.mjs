import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  root: "ui/",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./ui/src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "^/api": {
        target: "http://localhost:6501",
        changeOrigin: true,
      },
      "/api": {
        target: "ws://localhost:6501",
        ws: true,
      },
    },
  },
});
