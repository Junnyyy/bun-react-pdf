import { test, expect, describe } from "bun:test";
import { htmlToPdf, renderToPdf } from "./pdf.tsx";

describe("htmlToPdf", () => {
  test("returns a Uint8Array starting with PDF magic bytes", async () => {
    const pdf = await htmlToPdf("<html><body><h1>Hello</h1></body></html>");

    expect(pdf).toBeInstanceOf(Uint8Array);
    // PDF files start with %PDF-
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  test("respects format option (Letter vs A4 produce different sizes)", async () => {
    const html = "<html><body><h1>Hello</h1></body></html>";

    const a4Pdf = await htmlToPdf(html, { format: "A4" });
    const letterPdf = await htmlToPdf(html, { format: "Letter" });

    // Both should be valid PDFs
    expect(new TextDecoder().decode(a4Pdf.slice(0, 5))).toBe("%PDF-");
    expect(new TextDecoder().decode(letterPdf.slice(0, 5))).toBe("%PDF-");

    // Different formats should produce different file sizes
    expect(a4Pdf.byteLength).not.toBe(letterPdf.byteLength);
  });
});

describe("renderToPdf", () => {
  test("produces valid PDF from a simple React component", async () => {
    const pdf = await renderToPdf(
      <div>
        <h1>Test Document</h1>
        <p>This is a test paragraph.</p>
      </div>,
    );

    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  test("renders Tailwind-styled content (non-trivial PDF size)", async () => {
    const pdf = await renderToPdf(
      <div className="p-8 bg-white">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Styled Report</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-xl font-semibold">$1,234,567</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Growth</p>
            <p className="text-xl font-semibold text-green-600">+12.5%</p>
          </div>
        </div>
      </div>,
      { title: "Styled Report" },
    );

    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
    // Styled content should produce a reasonably sized PDF
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});
