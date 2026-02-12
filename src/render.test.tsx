import { test, expect, describe } from "bun:test";
import { renderToHtml } from "./render.tsx";

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
