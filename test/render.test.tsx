import { test, expect, describe } from "bun:test";
import { renderToHtml } from "../src/render.tsx";

describe("renderToHtml", () => {
  test("produces a complete HTML document", async () => {
    const html = await renderToHtml(<div>Hello</div>);

    expect(html).toStartWith("<!DOCTYPE html>");
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("</html>");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
  });

  test("renders component markup into the body", async () => {
    const html = await renderToHtml(
      <section>
        <h1>Title</h1>
        <p>Paragraph</p>
      </section>,
    );

    expect(html).toContain("<section>");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<p>Paragraph</p>");
  });

  test("compiles Tailwind classes into CSS", async () => {
    const html = await renderToHtml(
      <div className="flex items-center text-red-500 font-bold p-4">
        Styled
      </div>,
    );

    expect(html).toContain("<style>");
    // Tailwind should compile these into real CSS properties
    expect(html).toContain("display: flex");
    expect(html).toContain("font-weight:");
  });

  test("handles components with no Tailwind classes", async () => {
    const html = await renderToHtml(<div>Plain text</div>);

    expect(html).toContain("Plain text");
    expect(html).toContain("<style>");
  });

  test("sets custom title", async () => {
    const html = await renderToHtml(<div />, { title: "My Invoice" });

    expect(html).toContain("<title>My Invoice</title>");
  });

  test("uses default title when none provided", async () => {
    const html = await renderToHtml(<div />);

    expect(html).toContain("<title>Document</title>");
  });

  test("deduplicates class candidates", async () => {
    const html = await renderToHtml(
      <div>
        <span className="text-sm font-bold">A</span>
        <span className="text-sm font-bold">B</span>
      </div>,
    );

    // Should still compile fine with duplicated classes
    expect(html).toContain("font-weight:");
    // The CSS for text-sm should appear only once
    const matches = html.match(/\.text-sm/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  test("renders a full component with props", async () => {
    function Greeting({ name }: { name: string }) {
      return (
        <div className="p-4 bg-blue-100 rounded-lg">
          <p className="text-lg font-semibold text-blue-900">Hello, {name}!</p>
        </div>
      );
    }

    const html = await renderToHtml(<Greeting name="World" />);

    expect(html).toContain("Hello,");
    expect(html).toContain("World");
    expect(html).toContain("border-radius:");
  });

  test("handles nested components", async () => {
    function Badge({ children }: { children: React.ReactNode }) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          {children}
        </span>
      );
    }

    function Card() {
      return (
        <div className="border border-gray-200 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Status</h2>
          <Badge>Active</Badge>
        </div>
      );
    }

    const html = await renderToHtml(<Card />);

    expect(html).toContain("Active");
    expect(html).toContain("border-radius:");
    expect(html).toContain("font-weight:");
  });
});

describe("renderToHtml with css option", () => {
  test("includes custom CSS after Tailwind", async () => {
    const customCss = ".custom-class { border: 2px solid red; }";
    const html = await renderToHtml(
      <div className="flex p-4">Hello</div>,
      { css: customCss },
    );

    expect(html).toContain(".custom-class");
    expect(html).toContain("border: 2px solid red");
    // Custom CSS should come after Tailwind CSS (display: flex from Tailwind)
    expect(html).toContain("display: flex");
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    expect(styleMatch).not.toBeNull();
    const styleContent = styleMatch![1];
    const tailwindIdx = styleContent.indexOf("display: flex");
    const customIdx = styleContent.indexOf(".custom-class");
    expect(tailwindIdx).toBeLessThan(customIdx);
  });

  test("works unchanged without css option (backward compat)", async () => {
    const html = await renderToHtml(<div className="flex">Hello</div>);

    expect(html).toContain("display: flex");
    expect(html).toContain("<style>");
  });
});

describe("complex component rendering", () => {
  test("Dashboard renders SVG elements", async () => {
    const { default: Dashboard } = await import("../src/components/Dashboard.tsx");
    const html = await renderToHtml(<Dashboard />);

    expect(html).toContain("<svg");
    expect(html).toContain("<rect");
    expect(html).toContain("<path");
    expect(html).toContain("Sales Dashboard");
  });

  test("Report renders narrative and inline charts", async () => {
    const { default: Report } = await import("../src/components/Report.tsx");
    const html = await renderToHtml(<Report />);

    expect(html).toContain("Quarterly Business Report");
    expect(html).toContain("Executive Summary");
    expect(html).toContain("<svg");
    expect(html).toContain("Confidential");
  });

  test("Pie chart arcs have valid SVG path d attribute", async () => {
    const { default: Dashboard } = await import("../src/components/Dashboard.tsx");
    const html = await renderToHtml(<Dashboard />);

    // SVG path data should contain arc commands (A) and move commands (M)
    const pathDRegex = /d="M[\s\d.]+A[\s\d.]+/;
    expect(pathDRegex.test(html)).toBe(true);
  });

  test("conditional formatting produces correct Tailwind classes", async () => {
    const { default: Dashboard } = await import("../src/components/Dashboard.tsx");
    const html = await renderToHtml(<Dashboard />);

    // Positive trend should have green styling
    expect(html).toContain("text-green-600");
    // Negative trend should have red styling
    expect(html).toContain("text-red-600");
    // Status badges should be present
    expect(html).toContain("Above Target");
    expect(html).toContain("At Risk");
  });

  test("currency values are formatted correctly", async () => {
    const { default: Dashboard } = await import("../src/components/Dashboard.tsx");
    const html = await renderToHtml(<Dashboard />);

    // Should contain dollar-formatted values (e.g. $842,000)
    expect(html).toMatch(/\$[\d,]+/);
    // Summary card value
    expect(html).toContain("$2,847,500");
  });

  test("Report metrics table shows trend arrows", async () => {
    const { default: Report } = await import("../src/components/Report.tsx");
    const html = await renderToHtml(<Report />);

    // Trend arrows rendered as SVG polygons
    expect(html).toContain("<polygon");
    // Should contain percentage badges
    expect(html).toContain("bg-green-100");
  });
});
