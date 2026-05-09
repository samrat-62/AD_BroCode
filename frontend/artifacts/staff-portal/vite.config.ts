import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT ?? "5175";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const rawPreviewPort = process.env.PREVIEW_PORT ?? "4175";
const previewPort = Number(rawPreviewPort);

if (Number.isNaN(previewPort) || previewPort <= 0) {
  throw new Error(`Invalid PREVIEW_PORT value: "${rawPreviewPort}"`);
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@workspace/api-client-react": path.resolve(
        import.meta.dirname,
        "src",
        "lib",
        "local-api-client.ts",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "localhost",
    fs: {
      strict: true,
    },
  },
  preview: {
    port: previewPort,
    host: "localhost",
  },
});
