import { test, expect, describe } from "bun:test";
import { resolve } from "node:path";
import { extractCssImports } from "./css.ts";

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
