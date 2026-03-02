import { test, expect, describe } from "bun:test";
import { resolve } from "node:path";
import { extractCssImports } from "../src/css.ts";

const fixturesDir = resolve(import.meta.dir, "fixtures");

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

    // Should have read the actual file content, not an error
    expect(css.length).toBeGreaterThan(0);
    expect(css).toContain("border:");
  });
});

describe("extractCssImports - recursive", () => {
  test("finds CSS from transitive imports", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "parent-with-sub.tsx"));

    // Parent's own CSS (style-a.css)
    expect(css).toContain(".custom-class");
    // Sub-component's CSS (sub-component.css)
    expect(css).toContain(".sub-component");
  });

  test("parent CSS appears before child CSS", async () => {
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

    // sub-component.css should only appear once even if reachable through multiple paths
    const occurrences = css.split(".sub-component").length - 1;
    expect(occurrences).toBe(1);
  });

  test("handles file with no transitive CSS gracefully", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "no-css.tsx"));

    expect(css).toBe("");
  });
});

describe("extractCssImports - CSS @import inlining", () => {
  test("inlines @import rules from CSS files", async () => {
    // css-import-component.tsx -> with-css-import.css -> @import style-b.css
    const css = await extractCssImports(resolve(fixturesDir, "css-import-component.tsx"));

    // Content from with-css-import.css itself
    expect(css).toContain(".wrapper");
    // Content inlined from style-b.css via @import
    expect(css).toContain(".another-class");
  });

  test("removes @import rule after inlining", async () => {
    const css = await extractCssImports(resolve(fixturesDir, "css-import-component.tsx"));

    expect(css).not.toContain("@import");
  });

  test("preserves remote @import URLs (https, http, //)", async () => {
    const css = await extractCssImports(
      resolve(import.meta.dir, "..", "src", "components", "StyledCard.tsx"),
    );

    // Remote Google Fonts @import should be preserved, not stripped
    expect(css).toContain("@import url('https://fonts.googleapis.com");
    // Local CSS content should still be present
    expect(css).toContain(".card");
  });
});
