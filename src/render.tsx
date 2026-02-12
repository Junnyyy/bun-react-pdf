import { type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { compile } from "tailwindcss";

const tailwindIndexCss = await Bun.file(
  require.resolve("tailwindcss/index.css"),
).text();

/**
 * Extract all class name candidates from an HTML string.
 * renderToString outputs `class="..."`, not `className="..."`.
 */
function extractCandidates(html: string): string[] {
  const candidates = new Set<string>();
  const classRegex = /class="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(html)) !== null) {
    for (const cls of match[1].split(/\s+/)) {
      if (cls) candidates.add(cls);
    }
  }

  return [...candidates];
}

export interface RenderOptions {
  title?: string;
}

/**
 * Render a React element to a complete, self-contained HTML document
 * with compiled Tailwind CSS inlined in a <style> tag.
 */
export async function renderToHtml(
  element: ReactElement,
  options?: RenderOptions,
): Promise<string> {
  const bodyHtml = renderToString(element);

  const candidates = extractCandidates(bodyHtml);
  const compiler = await compile(tailwindIndexCss);
  const css = compiler.build(candidates);

  const title = options?.title ?? "Document";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
