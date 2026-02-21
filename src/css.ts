import { dirname, resolve, isAbsolute } from "node:path";

/**
 * Extract CSS imports from a .tsx/.jsx/.ts/.js source file,
 * read each CSS file, and return the concatenated CSS string.
 */
export async function extractCssImports(filePath: string): Promise<string> {
  const absolutePath = isAbsolute(filePath)
    ? filePath
    : resolve(filePath);

  const source = await Bun.file(absolutePath).text();
  const dir = dirname(absolutePath);

  const importRegex = /import\s+['"](.+\.css)['"]/g;
  const cssChunks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(source)) !== null) {
    const specifier = match[1];
    let cssPath: string;

    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      // Relative or absolute path
      cssPath = resolve(dir, specifier);
    } else {
      // Package path (e.g., 'normalize.css')
      cssPath = require.resolve(specifier);
    }

    const css = await Bun.file(cssPath).text();
    cssChunks.push(css);
  }

  return cssChunks.join("");
}
