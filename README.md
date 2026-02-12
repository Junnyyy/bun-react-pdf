# bun-react-pdf

Render React components with Tailwind CSS into self-contained HTML documents. A proof of concept for generating PDFs from React + Tailwind.

## Setup

```bash
bun install
```

## Usage

### CLI

Render any React component file to `output.html`:

```bash
bun run render ./src/components/Invoice.tsx
```

The component must have a default export.

### Library

```ts
import { renderToHtml } from "./index.ts";

function MyComponent() {
  return <div className="p-4 text-lg font-bold">Hello</div>;
}

const html = await renderToHtml(<MyComponent />, { title: "My Document" });
await Bun.write("output.html", html);
```

`renderToHtml` returns a complete HTML document with all Tailwind CSS compiled and inlined in a `<style>` tag. No external stylesheets needed.

## How it works

1. Renders the React component to an HTML string via `renderToString` from `react-dom/server`
2. Extracts Tailwind class candidates from the rendered markup
3. Compiles only the used Tailwind utilities via the `compile()` API from `tailwindcss`
4. Wraps everything in a self-contained HTML document

## Testing

```bash
bun test
```
