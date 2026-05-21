#!/usr/bin/env node

/**
 * Converts individual HTML slide files to a single PDF.
 *
 * Each slide is opened in Puppeteer at 1280×720, rendered with
 * page.pdf() to a single-page PDF, then all pages are merged
 * with pdf-lib into one file.
 *
 * The resulting PDF uses 1280×720 page size. Most PDF viewers
 * (Adobe Acrobat, macOS Preview, Evince) support a "presentation
 * mode" or "full screen" mode that displays one page at a time
 * with no chrome — behaving like a slide deck. This is a property
 * of the viewer, not the PDF itself; no special PDF metadata is
 * needed.
 */

import { resolve, basename } from "path";
import { readFile, writeFile } from "fs/promises";
import puppeteer from "puppeteer";
import { PDFDocument, PDFName } from "pdf-lib";

function usage() {
  console.log(`Usage: html-to-pdf.js [options] <slide1.html> [slide2.html ...]

Options:
  --output, -o <file>   Output PDF file path (default: output.pdf)
  --help, -h            Show this help message`);
  process.exit(0);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let output = "output.pdf";
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") usage();
    if (args[i] === "--output" || args[i] === "-o") { output = args[++i]; continue; }
    files.push(args[i]);
  }
  if (files.length === 0) { console.error("Error: No HTML files specified."); usage(); }
  return { output, files };
}

async function main() {
  const { output, files } = parseArgs(process.argv);

  console.log(`Converting ${files.length} slide(s) → ${output}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
    ],
  });

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const filePath = resolve(files[i]);
    const fileName = basename(filePath);
    console.log(`  [${i + 1}/${files.length}] ${fileName}`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    try {
      await page.goto(`file://${filePath}`, { waitUntil: "load", timeout: 15000 });
      await page.evaluate((timeout) => Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.querySelectorAll("img")).map(img =>
            img.complete ? Promise.resolve() :
            new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
          ),
        ]),
        new Promise(resolve => setTimeout(resolve, timeout)),
      ]), 8000);
    } catch (e) {
      console.error(`    ✗ Failed to load: ${e.message}`);
      await page.close();
      continue;
    }

    const pdfBytes = await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      preferCSSPageSize: true,
    });

    const slidePdf = await PDFDocument.load(pdfBytes);
    const [copiedPage] = await mergedPdf.copyPages(slidePdf, [0]);
    mergedPdf.addPage(copiedPage);

    await page.close();
  }

  // PageLayout=SinglePage: viewers show one page at a time (no continuous scroll).
  // PageMode=FullScreen: viewers open in fullscreen presentation mode.
  // This makes the PDF behave like a slide deck in Acrobat, Preview, Evince, etc.
  const catalog = mergedPdf.catalog;
  catalog.set(PDFName.of("PageLayout"), PDFName.of("SinglePage"));
  catalog.set(PDFName.of("PageMode"), PDFName.of("FullScreen"));

  const pdfBytes = await mergedPdf.save();
  await writeFile(resolve(output), pdfBytes);

  const sizeKB = Math.round(pdfBytes.length / 1024);
  console.log(`\n✓ PDF written to ${resolve(output)} (${files.length} pages, ${sizeKB} KB)`);

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
