import { resolve, basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { createElement } from "react";
import { renderToHtml } from "./render.tsx";

const componentPath = process.argv[2];

if (!componentPath) {
  console.error("Usage: bun run src/cli.tsx <component-file>");
  process.exit(1);
}

const absolutePath = resolve(componentPath);
const mod = await import(absolutePath);
const Component = mod.default;

if (typeof Component !== "function") {
  console.error(`No default export function found in ${componentPath}`);
  process.exit(1);
}

const stem = basename(componentPath).replace(/\.(tsx?|jsx?)$/, "");
const outputDir = "output";
await mkdir(outputDir, { recursive: true });
const outputPath = join(outputDir, `${stem}.html`);

const html = await renderToHtml(createElement(Component), { title: stem });
await Bun.write(outputPath, html);
console.log(`Wrote ${outputPath} (${html.length} bytes)`);
