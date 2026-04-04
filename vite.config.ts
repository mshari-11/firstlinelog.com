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
        const spaRoutes = [
          "/admin",
          "/admin-panel",
          "/unified-login",
          "/courier",
          "/login",
          "/application-status",
        ];
        if (req.url && spaRoutes.some((r) => req.url!.startsWith(r))) {
          req.url = "/spa.html";
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(command === "serve" ? [spaFallback()] : []),
  ],
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
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "lucide-react",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
            "framer-motion",
            "cmdk",
            "sonner",
          ],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-toast",
          ],
          "vendor-charts": ["recharts"],
          "vendor-map": ["mapbox-gl"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-table": [
            "@tanstack/react-query",
            "@tanstack/react-table",
            "zustand",
            "zod",
          ],
          "vendor-xlsx": ["xlsx"],
          "vendor-utils": ["date-fns"],
        },
      },
    },
  },
}));
