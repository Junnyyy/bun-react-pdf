# bun-react-pdf

Render React components with Tailwind CSS into self-contained HTML documents and PDFs. Supports importing custom CSS files from your components.

## Setup

```bash
bun install
```

## Usage

### CLI

Render any React component file to HTML:

```bash
bun run render ./src/components/Invoice.tsx
```

Render to PDF:

```bash
bun run render ./src/components/Invoice.tsx --pdf
```

The component must have a default export. Output files are written to the `output/` directory.

Render all example components at once:

```bash
bun run render:all        # HTML
bun run render:all:pdf    # PDF
```

### Library

#### HTML output

```ts
import { renderToHtml } from "./index.ts";

function MyComponent() {
  return <div className="p-4 text-lg font-bold">Hello</div>;
}

const html = await renderToHtml(<MyComponent />, { title: "My Document" });
await Bun.write("output.html", html);
```

`renderToHtml` returns a complete HTML document with all Tailwind CSS compiled and inlined in a `<style>` tag. No external stylesheets needed.

#### Custom CSS imports

Components can import `.css` files directly. The CLI auto-detects these imports and inlines them alongside Tailwind:

```tsx
// src/components/StyledCard.tsx
import './StyledCard.css'

export default function StyledCard() {
  return <div className="flex p-4 card">Hello</div>
}
```

```css
/* src/components/StyledCard.css */
.card { box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
```

Custom CSS is appended after Tailwind, so it can override utilities when needed.

When using the library API directly, use `extractCssImports` to read CSS from a component file and pass it via the `css` option:

```ts
import { renderToHtml, extractCssImports } from "./index.ts";

const css = await extractCssImports("./src/components/StyledCard.tsx");
const html = await renderToHtml(<StyledCard />, { title: "Card", css });
```

#### PDF output

```ts
import { renderToPdf, htmlToPdf } from "./index.ts";

// From a React element
const pdf = await renderToPdf(<MyComponent />, {
  title: "My Document",
  format: "A4", // or "Letter"
});
await Bun.write("output.pdf", pdf);

// From an HTML string
const pdfFromHtml = await htmlToPdf("<html><body><h1>Hello</h1></body></html>", {
  format: "Letter",
});
await Bun.write("output.pdf", pdfFromHtml);
```

Both functions return a `Uint8Array` containing the PDF bytes.

## How it works

1. Renders the React component to an HTML string via `renderToString` from `react-dom/server`
2. Extracts Tailwind class candidates from the rendered markup
3. Compiles only the used Tailwind utilities via the `compile()` API from `tailwindcss`
4. Detects `import '*.css'` statements in the source file and reads the referenced CSS files
5. Wraps everything in a self-contained HTML document (Tailwind first, then custom CSS)
6. For PDF output, loads the HTML in headless Chrome (Puppeteer) with `screen` media type and generates a PDF with `printBackground: true`

## Testing

```bash
bun test
```
