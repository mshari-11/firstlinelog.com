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
  build: {
    // Output into dist/ — vercel.json rewrites admin routes to /dist/index.html
    outDir: "dist",
    emptyOutDir: true,
    // Use spa.html as SPA entry (keeps root index.html as the static public site)
    rollupOptions: {
      input: path.resolve(__dirname, "spa.html"),
    },
  },
});

