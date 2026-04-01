/**
 * Post-build script: sync index.html SPA bundle references
 * After Vite builds, the dist/ assets have new hashes.
 * This script updates root index.html to point to the correct files.
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const distAssets = join(process.cwd(), "dist", "assets");
const indexPath = join(process.cwd(), "index.html");

const files = readdirSync(distAssets);
const spaJs = files.find((f) => f.startsWith("spa-") && f.endsWith(".js"));
const spaCss = files.find((f) => f.startsWith("spa-") && f.endsWith(".css"));

if (!spaJs || !spaCss) {
  console.warn("[sync-index-assets] Could not find spa-*.js or spa-*.css in dist/assets/");
  process.exit(0);
}

let html = readFileSync(indexPath, "utf-8");
html = html.replace(/\/dist\/assets\/spa-[^"]*\.js/, `/dist/assets/${spaJs}`);
html = html.replace(/\/dist\/assets\/spa-[^"]*\.css/, `/dist/assets/${spaCss}`);
writeFileSync(indexPath, html, "utf-8");

console.log(`[sync-index-assets] Updated index.html → ${spaJs}, ${spaCss}`);
