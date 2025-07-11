// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/", // ✅ IMPORTANT for correct asset paths on Render
  plugins: [react(), cesium()],
  build: {
    outDir: "dist", // ✅ Vite will output here, server will serve this folder
  },
  server: {
    proxy: {
      "/api/tle": {
        target: "http://localhost:3001", // ✅ Only used during dev
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
