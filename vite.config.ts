import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/mohasagor-api": {
        target: "https://mohasagor.com.bd",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mohasagor-api/, "/api"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("content-type");
            proxyReq.setHeader("api-key", "A8niclztH9JtzS4t");
            proxyReq.setHeader("secret-key", "2ff380917a11d3a7c97bcf6dddfb8adf38194c7d6b726ab12c4d0d5fb136fef8");
          });
        },
      },
"/local-api": {
  target: "https://h9zgeyv2sm.localto.net",
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/local-api/, ""),
  headers: {
  "localtonet-skip-warning": "true"
  }
},
    },
  },
});
