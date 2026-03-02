---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

## Project Architecture

- `src/render.tsx` — `renderToHtml()` renders React elements to self-contained HTML with inlined Tailwind CSS; accepts optional `css` string appended after Tailwind
- `src/css.ts` — `extractCssImports()` recursively walks the import graph using `Bun.Transpiler.scan()` + `import.meta.resolve()`, collects CSS from all transitive imports in depth-first order, and inlines CSS `@import` rules for self-contained output
- `src/pdf.tsx` — `htmlToPdf()` and `renderToPdf()` convert HTML/React to PDF via Puppeteer (headless Chrome); `RenderPdfOptions` accepts `css` and threads it to `renderToHtml`
- `src/cli.tsx` — CLI entry point; supports `--pdf` flag; auto-detects CSS imports from the component file via `extractCssImports()`
- `src/components/` — Example components (Invoice, Dashboard, Report, StyledCard)
- `index.ts` — Public API exports (`renderToHtml`, `htmlToPdf`, `renderToPdf`, `extractCssImports`)
- `test/` — All tests (`render.test.tsx`, `pdf.test.tsx`, `css.test.ts`) and `test/fixtures/` for test fixture `.tsx`/`.css` files
- PDF generation uses `page.emulateMediaType('screen')` so Tailwind backgrounds render correctly (Puppeteer defaults to `print` media which strips backgrounds)
- CSS imports are detected via `Bun.Transpiler.scan()` (AST-level, skips `import type`) and resolved via `import.meta.resolve()` — no hand-rolled extension probing
- CSS extraction walks the full import graph recursively: sub-components that import CSS are automatically included
- CSS `@import` rules inside CSS files are inlined for self-contained output; remote URLs (https/http) are preserved
- `node_modules` code files are not recursed into (only their CSS files are collected directly) — this avoids unpredictable dependency tree walking (learned from Next.js)
- CSS order follows JS import order (depth-first traversal), matching Next.js and Vite behavior
- CSS files are deduplicated by resolved absolute path
- `require.resolve()` in Bun does NOT throw for `https://` URLs — it returns them as-is. Always check for remote URLs before passing to file operations
