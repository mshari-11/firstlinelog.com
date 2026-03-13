import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

/** Dev-only: serve spa.html instead of index.html for SPA routes */
function spaFallback(): Plugin {
  return {
    name: "spa-html-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const spaRoutes = ["/admin", "/admin-panel", "/unified-login", "/courier", "/login", "/application-status"];
        if (req.url && spaRoutes.some(r => req.url!.startsWith(r))) {
          req.url = "/spa.html";
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), ...(command === "serve" ? [spaFallback()] : [])],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production needs /dist/ base for Vercel; dev server needs /
  base: command === "serve" ? "/" : "/dist/",
  build: {
    // Output into dist/ — vercel.json rewrites admin routes to /dist/index
    outDir: "dist",
    emptyOutDir: true,
    // Use spa.html as SPA entry (keeps root index.html as the static public site)
    rollupOptions: {
      input: path.resolve(__dirname, "spa.html"),
    },
  },
}));

