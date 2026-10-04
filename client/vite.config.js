import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import {
  frontendHeaders,
  readPublicConfig,
  robotsText,
} from "./src/config/deployment.js";

export default defineConfig(({ mode, command }) => {
  const config = readPublicConfig({
    ...loadEnv(mode, process.cwd(), "VITE_"),
    DEV: command === "serve" && mode !== "production",
  });
  const headers = frontendHeaders(config);
  return {
    plugins: [
      react(),
      {
        name: "deployment-assets",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "robots.txt",
            source: robotsText(config.siteUrl),
          });
          this.emitFile({
            type: "asset",
            fileName: "security-headers.json",
            source: JSON.stringify(headers, null, 2) + "\n",
          });
        },
      },
    ],
    preview: { headers },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": { target: "http://localhost:5000", changeOrigin: true },
        "/sitemap.xml": { target: "http://localhost:5000", changeOrigin: true },
      },
    },
  };
});
