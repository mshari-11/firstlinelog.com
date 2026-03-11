import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Rename spa.html → index.html in dist output
    {
      name: "rename-spa-to-index",
      closeBundle() {
        const fs = require("fs");
        const src = path.resolve(__dirname, "dist/spa.html");
        const dest = path.resolve(__dirname, "dist/index.html");
        if (fs.existsSync(src)) {
          fs.renameSync(src, dest);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "spa.html"),
    },
  },
});
