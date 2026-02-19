import { resolve, basename, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { createElement } from "react";
import { renderToHtml } from "./render.tsx";

const args = process.argv.slice(2);
const pdfFlag = args.includes("--pdf");
const componentPath = args.find((arg) => !arg.startsWith("--"));

if (!componentPath) {
  console.error("Usage: bun run src/cli.tsx <component-file> [--pdf]");
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

if (pdfFlag) {
  const { renderToPdf } = await import("./pdf.tsx");
  const pdf = await renderToPdf(createElement(Component), { title: stem });
  const outputPath = join(outputDir, `${stem}.pdf`);
  await Bun.write(outputPath, pdf);
  console.log(`Wrote ${outputPath} (${pdf.byteLength} bytes)`);
} else {
  const html = await renderToHtml(createElement(Component), { title: stem });
  const outputPath = join(outputDir, `${stem}.html`);
  await Bun.write(outputPath, html);
  console.log(`Wrote ${outputPath} (${html.length} bytes)`);
}
