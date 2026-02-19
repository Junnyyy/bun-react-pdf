import { type ReactElement } from "react";
import puppeteer from "puppeteer";
import { renderToHtml } from "./render.tsx";

export type PageFormat = "A4" | "Letter";

export interface PdfOptions {
  format?: PageFormat;
}

export interface RenderPdfOptions extends PdfOptions {
  title?: string;
}

/**
 * Convert an HTML string to a PDF buffer using Puppeteer.
 */
export async function htmlToPdf(
  html: string,
  options?: PdfOptions,
): Promise<Uint8Array> {
  const format = options?.format ?? "A4";

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("screen");
    const pdf = await page.pdf({ format, printBackground: true });
    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * Render a React element directly to a PDF buffer.
 */
export async function renderToPdf(
  element: ReactElement,
  options?: RenderPdfOptions,
): Promise<Uint8Array> {
  const html = await renderToHtml(element, { title: options?.title });
  return htmlToPdf(html, options);
}
