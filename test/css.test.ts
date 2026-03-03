import { test, expect, describe } from "bun:test";
import { resolve } from "node:path";
import { createElement } from "react";
import { extractCssImports } from "../src/css.ts";
import { renderToHtml } from "../src/render.tsx";

const fixturesDir = resolve(import.meta.dir, "fixtures");

// ─── Basic extraction ─────────────────────────────────────────────────

describe("extractCssImports", () => {
  test("finds CSS import from a .tsx file", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "single-import.tsx"));

    expect(css).toContain(".custom-class");
    expect(css).toContain("border: 2px solid red");
  });

  test("concatenates multiple CSS files in import order", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "multi-import.tsx"));

    expect(css).toContain(".custom-class");
    expect(css).toContain(".another-class");
    // style-a should come before style-b
    const idxA = css.indexOf(".custom-class");
    const idxB = css.indexOf(".another-class");
    expect(idxA).toBeLessThan(idxB);
  });

  test("returns empty string when no CSS imports", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "no-css.tsx"));

    expect(css).toBe("");
  });

  test("resolves relative paths correctly", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "single-import.tsx"));

    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain("border:");
  });
});

// ─── Recursive import graph walking ───────────────────────────────────

describe("extractCssImports - recursive", () => {
  test("finds CSS from transitive imports", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-sub.tsx"));

    expect(css).toContain(".custom-class");
    expect(css).toContain(".sub-component");
  });

  test("parent CSS appears before child CSS (depth-first order)", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-sub.tsx"));

    const parentIdx = css.indexOf(".custom-class");
    const childIdx = css.indexOf(".sub-component");
    expect(parentIdx).toBeLessThan(childIdx);
  });

  test("finds CSS through chain with no direct CSS at intermediate level", async () => {
    // deep-chain.tsx -> sub-component.tsx -> sub-component.css
    const css = await extractCssImports(resolve(fixturesDir, "deep-chain.tsx"));

    expect(css).toContain(".sub-component");
  });

  test("deduplicates CSS imported from multiple places", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-sub.tsx"));

    const occurrences = css.split(".sub-component").length - 1;
    expect(occurrences).toBe(1);
  });

  test("handles file with no transitive CSS gracefully", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "no-css.tsx"));

    expect(css).toBe("");
  });

  test("handles circular imports without infinite loop", async () => {
    // circular-a.tsx imports circular-b.tsx, which imports circular-a.tsx
    const css = await extractCssImports(resolve(fixturesDir, "circular-a.tsx"));

    expect(css).toContain(".custom-class");  // from circular-a -> style-a.css
    expect(css).toContain(".another-class"); // from circular-b -> style-b.css
  });

  test("deduplicates shared CSS across sibling branches", async () => {
    // parent-with-siblings.tsx -> sibling-a.tsx -> shared.css
    //                          -> sibling-b.tsx -> shared.css (same file)
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-siblings.tsx"));

    // shared.css should appear exactly once
    const occurrences = css.split(".shared").length - 1;
    expect(occurrences).toBe(1);

    // Both siblings' unique CSS should also be present
    expect(css).toContain(".custom-class");
    expect(css).toContain(".another-class");
  });

  test("sibling CSS collected in depth-first import order", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-siblings.tsx"));

    // sibling-a imported first: shared.css, then style-a.css
    // sibling-b imported second: shared.css (deduped), then style-b.css
    const sharedIdx = css.indexOf(".shared");
    const aIdx = css.indexOf(".custom-class");
    const bIdx = css.indexOf(".another-class");
    expect(sharedIdx).toBeLessThan(aIdx);
    expect(aIdx).toBeLessThan(bIdx);
  });

  test("resolves extensionless imports via import.meta.resolve", async () => {
    // import { SubComponent } from './sub-component' (no .tsx extension)
    const css = await extractCssImports(resolve(fixturesDir, "extensionless-import.tsx"));

    expect(css).toContain(".sub-component");
  });

  test("skips import type statements", async () => {
    // import type { ReactNode } from 'react' should not trigger recursion
    const css = await extractCssImports(resolve(fixturesDir, "type-only-import.tsx"));

    expect(css).toContain(".custom-class");
  });

  test("collects CSS from real components with sub-component imports", async () => {
    // StyledCard.tsx imports StyledCard.css (local CSS file)
    const css = await extractCssImports(
      resolve(import.meta.dir, "..", "src", "components", "StyledCard.tsx"),
    );

    expect(css).toContain(".card");
    expect(css).toContain("font-family");
  });
});

// ─── CSS @import inlining ─────────────────────────────────────────────

describe("extractCssImports - CSS @import inlining", () => {
  test("inlines @import rules from CSS files", async () => {
    // css-import-component.tsx -> with-css-import.css -> @import style-b.css
    const css = await extractCssImports(resolve(fixturesDir, "css-import-component.tsx"));

    expect(css).toContain(".wrapper");
    expect(css).toContain(".another-class");
  });

  test("removes local @import rule after inlining", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "css-import-component.tsx"));

    expect(css).not.toContain("@import");
  });

  test("preserves remote @import URLs (https, http, //)", async () => {
    const css = await extractCssImports(
      resolve(import.meta.dir, "..", "src", "components", "StyledCard.tsx"),
    );

    expect(css).toContain("@import url('https://fonts.googleapis.com");
    expect(css).toContain(".card");
  });

  test("deduplicates CSS @import across multiple CSS files", async () => {
    // nested-css-imports.tsx imports theme.css and layout.css
    // Both @import base-vars.css — it should only be inlined once
    const css = await extractCssImports(resolve(fixturesDir, "nested-css-imports.tsx"));

    // Count the :root definition block (from base-vars.css), not var() references
    const occurrences = css.split(":root").length - 1;
    expect(occurrences).toBe(1);

    expect(css).toContain(".theme-card");
    expect(css).toContain(".layout");
  });

  test("nested CSS @import chains are fully resolved", async () => {
    // theme.css @imports base-vars.css which defines :root vars
    const css = await extractCssImports(resolve(fixturesDir, "nested-css-imports.tsx"));

    expect(css).toContain("--color-primary");
    expect(css).toContain("--spacing");
    // No local @import rules should remain
    expect(css).not.toContain("@import");
  });

  test("inlined @import content appears before the importing file's own rules", async () => {
    // theme.css: @import './base-vars.css'; then .theme-card { ... }
    // base-vars.css content should come first, then .theme-card
    const css = await extractCssImports(resolve(fixturesDir, "nested-css-imports.tsx"));

    const varsIdx = css.indexOf("--color-primary");
    const themeIdx = css.indexOf(".theme-card");
    expect(varsIdx).toBeLessThan(themeIdx);
  });

  test("wraps inlined content in @media when @import has a media query", async () => {
    // @import './mobile.css' screen and (max-width: 768px);
    const css = await extractCssImports(resolve(fixturesDir, "media-import-component.tsx"));

    // mobile.css content should be wrapped in @media
    expect(css).toContain("@media screen and (max-width: 768px)");
    expect(css).toContain(".mobile-only");
    // The container rule from the host file should not be wrapped
    expect(css).toContain(".container");
    // No raw @import should remain
    expect(css).not.toMatch(/@import\s+['"]/);
  });
});

// ─── End-to-end rendering ─────────────────────────────────────────────

describe("extractCssImports - end-to-end rendering", () => {
  test("sub-component CSS appears in rendered HTML output", async () => {
    const mod = await import("./fixtures/parent-with-sub.tsx");
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-sub.tsx"));
    const html = await renderToHtml(createElement(mod.default), { css });

    expect(html).toContain(".custom-class");
    expect(html).toContain(".sub-component");
    // Component markup should be present
    expect(html).toContain("Sub");
  });

  test("CSS @import content appears in rendered HTML output", async () => {
    const mod = await import("./fixtures/css-import-component.tsx");
    const css = await extractCssImports(resolve(fixturesDir, "css-import-component.tsx"));
    const html = await renderToHtml(createElement(mod.default), { css });

    expect(html).toContain(".wrapper");
    expect(html).toContain(".another-class");
    expect(html).not.toContain("@import './style-b.css'");
  });

  test("deeply nested component tree CSS is included in HTML", async () => {
    const mod = await import("./fixtures/parent-with-siblings.tsx");
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-siblings.tsx"));
    const html = await renderToHtml(createElement(mod.default), { css });

    // All CSS from sibling branches should be in the <style> tag
    expect(html).toContain(".shared");
    expect(html).toContain(".custom-class");
    expect(html).toContain(".another-class");
  });
});
