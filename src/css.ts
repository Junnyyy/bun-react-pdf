import { extname, isAbsolute, resolve, dirname } from "node:path";

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs",
]);

const LOADER_MAP: Record<string, "tsx" | "ts" | "jsx" | "js"> = {
  ".tsx": "tsx",
  ".ts": "ts",
  ".mts": "ts",
  ".cts": "ts",
  ".jsx": "jsx",
  ".js": "js",
  ".mjs": "js",
  ".cjs": "js",
};

/**
 * Recursively walk the import graph starting from `filePath`,
 * collect all CSS imports in depth-first order, inline CSS @import rules,
 * and return the concatenated CSS string.
 *
 * Uses Bun.Transpiler.scan() for AST-level import parsing and
 * import.meta.resolve() for native module resolution — no hand-rolled
 * extension probing or path guessing.
 *
 * Design decisions informed by Next.js and Vite:
 * - CSS order follows JS import order (depth-first traversal)
 * - Deduplicate by resolved file path
 * - Inline CSS @import rules for self-contained output
 * - Don't recurse into node_modules code files (unpredictable internals)
 */
export async function extractCssImports(filePath: string): Promise<string> {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(filePath);
  const cssFiles: string[] = [];
  const visited = new Set<string>();

  await walkImports(absolutePath, cssFiles, visited);

  // Read all CSS files, inline their @import rules, and concatenate.
  // Sequential processing ensures @import deduplication works correctly —
  // if theme.css and layout.css both @import base-vars.css, it's only inlined once.
  const inlinedPaths = new Set<string>();
  const cssChunks: string[] = [];
  for (const cssPath of cssFiles) {
    cssChunks.push(await readAndInlineCssImports(cssPath, inlinedPaths));
  }

  return cssChunks.join("\n");
}

/**
 * Recursively walk JS/TS imports to find all CSS files in the dependency tree.
 */
async function walkImports(
  filePath: string,
  cssFiles: string[],
  visited: Set<string>,
): Promise<void> {
  if (visited.has(filePath)) return;
  visited.add(filePath);

  const ext = extname(filePath);
  const loader = LOADER_MAP[ext];
  if (!loader) return;

  let source: string;
  try {
    source = await Bun.file(filePath).text();
  } catch {
    return;
  }

  const transpiler = new Bun.Transpiler({ loader });
  let imports: Array<{ path: string; kind: string }>;
  try {
    imports = transpiler.scan(source).imports;
  } catch {
    return;
  }

  for (const imp of imports) {
    if (imp.kind !== "import-statement" && imp.kind !== "require-call") continue;

    const resolvedPath = resolveSpecifier(imp.path, filePath);
    if (!resolvedPath) continue;

    if (resolvedPath.endsWith(".css")) {
      // Collect CSS file (deduplicate by path)
      if (!cssFiles.includes(resolvedPath)) {
        cssFiles.push(resolvedPath);
      }
    } else if (isLocalCodeFile(resolvedPath)) {
      // Recurse into local code files only — skip node_modules internals
      await walkImports(resolvedPath, cssFiles, visited);
    }
  }
}

/**
 * Resolve an import specifier to an absolute file path.
 * Uses import.meta.resolve for full paths, falls back to require.resolve
 * for extensionless relative imports (import.meta.resolve doesn't add
 * extensions for relative paths like ./foo — it returns ./foo as-is).
 */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  try {
    const fileUrl = `file://${fromFile}`;
    const resolvedUrl = import.meta.resolve(specifier, fileUrl);
    const resolvedPath = new URL(resolvedUrl).pathname;

    // import.meta.resolve returns extensionless paths as-is for relative imports.
    // Fall back to require.resolve which does proper extension probing.
    const ext = extname(resolvedPath);
    if (!ext || (!CODE_EXTENSIONS.has(ext) && ext !== ".css")) {
      return require.resolve(resolvedPath);
    }

    return resolvedPath;
  } catch {
    // Unresolvable (built-in modules like 'react', 'node:path', etc.)
    return null;
  }
}

/**
 * Check if a resolved path is a local code file (not in node_modules).
 */
function isLocalCodeFile(resolvedPath: string): boolean {
  if (resolvedPath.includes("/node_modules/")) return false;
  return CODE_EXTENSIONS.has(extname(resolvedPath));
}

/**
 * Read a CSS file and recursively inline any @import rules.
 * Matches what Vite's postcss-import does — without this, @import rules
 * would be broken in our self-contained HTML output.
 */
async function readAndInlineCssImports(
  cssPath: string,
  inlinedPaths: Set<string>,
): Promise<string> {
  if (inlinedPaths.has(cssPath)) return "";
  inlinedPaths.add(cssPath);

  let content: string;
  try {
    content = await Bun.file(cssPath).text();
  } catch {
    return "";
  }

  const dir = dirname(cssPath);
  // Match full @import statements including optional media queries:
  //   @import url("...") screen;  @import '...' print;  @import "..." ;
  // Group 1: url() path, Group 2: string path, Group 3: optional media query
  const importRegex = /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*([^;]*)?\s*;?/g;
  let match: RegExpExecArray | null;

  const replacements: Array<{ start: number; end: number; content: string }> = [];

  while ((match = importRegex.exec(content)) !== null) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;

    const mediaQuery = match[3]?.trim() || "";

    // Preserve remote URLs (https://, http://, //) — they're valid in browser CSS
    if (specifier.startsWith("http://") || specifier.startsWith("https://") || specifier.startsWith("//")) {
      continue;
    }

    let resolvedPath: string;
    try {
      if (specifier.startsWith(".") || specifier.startsWith("/")) {
        resolvedPath = resolve(dir, specifier);
      } else {
        resolvedPath = require.resolve(specifier);
      }
    } catch {
      continue;
    }

    let inlinedContent = await readAndInlineCssImports(resolvedPath, inlinedPaths);
    // Wrap in @media block if the @import had a media query condition
    if (mediaQuery && inlinedContent) {
      inlinedContent = `@media ${mediaQuery} {\n${inlinedContent}\n}`;
    }
    replacements.push({
      start: match.index,
      end: match.index + match[0].length,
      content: inlinedContent,
    });
  }

  // Apply replacements in reverse order to preserve indices
  let result = content;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    result = result.slice(0, r.start) + r.content + result.slice(r.end);
  }

  return result;
}
