import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Assets are served from /dist/assets/ since outputDirectory is "." (root)
  base: "/dist/",
  build: {
    // Output into dist/ — vercel.json rewrites admin routes to /dist/index
    outDir: "dist",
    emptyOutDir: true,
    // Use spa.html as SPA entry (keeps root index.html as the static public site)
    rollupOptions: {
      input: path.resolve(__dirname, "spa.html"),
    },
  },
});

