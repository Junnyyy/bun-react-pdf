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

  // Read all CSS files, inline their @import rules, and concatenate
  const inlinedPaths = new Set<string>();
  const cssChunks = await Promise.all(
    cssFiles.map((cssPath) => readAndInlineCssImports(cssPath, inlinedPaths)),
  );

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

  const fileUrl = `file://${filePath}`;

  for (const imp of imports) {
    if (imp.kind !== "import-statement" && imp.kind !== "require-call") continue;

    let resolvedPath: string;
    try {
      const resolvedUrl = import.meta.resolve(imp.path, fileUrl);
      resolvedPath = new URL(resolvedUrl).pathname;
    } catch {
      // Unresolvable (built-in modules, missing packages, etc.)
      continue;
    }

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
  // Match @import url("..."), @import url('...'), @import url(...),
  // @import "...", @import '...'
  const importRegex = /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"]);?/g;
  let match: RegExpExecArray | null;

  const replacements: Array<{ start: number; end: number; content: string }> = [];

  while ((match = importRegex.exec(content)) !== null) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;

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

    const inlinedContent = await readAndInlineCssImports(resolvedPath, inlinedPaths);
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
