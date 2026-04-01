import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const distAssets = join(process.cwd(), "dist", "assets");
const indexPath = join(process.cwd(), "index.html");

const files = readdirSync(distAssets);
const spaJs = files.find((f) => f.startsWith("spa-") && f.endsWith(".js"));
const spaCss = files.find((f) => f.startsWith("spa-") && f.endsWith(".css"));

if (!spaJs || !spaCss) {
  console.warn("[sync] spa assets not found, skipping");
  process.exit(0);
}

let html = readFileSync(indexPath, "utf-8");
html = html.replace(/\/(?:dist\/)?assets\/(?:spa|index)-[^"]*\.js/, `/dist/assets/${spaJs}`);
html = html.replace(/\/(?:dist\/)?assets\/(?:spa|index)-[^"]*\.css/, `/dist/assets/${spaCss}`);
writeFileSync(indexPath, html, "utf-8");

console.log(`[sync] index.html → ${spaJs}, ${spaCss}`);
