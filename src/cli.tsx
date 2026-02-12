import { resolve } from "node:path";
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

const html = await renderToHtml(createElement(Component));
await Bun.write("output.html", html);
console.log(`Wrote output.html (${html.length} bytes)`);
