// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    cesium(),
  ],
  server: {
    proxy: {
      "/api/tle": {
        target: "https://celestrak.org",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/tle/,
            "/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
          ),
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
