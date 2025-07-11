// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/", // ✅ IMPORTANT for Render deployment
  plugins: [react(), cesium()],
  server: {
    proxy: {
      "/api/tle": {
        target: "http://localhost:3001", // ✅ Local dev only
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      cesium: resolve(__dirname, "node_modules/cesium/Build/Cesium"),
    },
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify("/cesium/"),
  },
});
