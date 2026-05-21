#!/usr/bin/env node

import { resolve, basename } from "path";
import puppeteer from "puppeteer";
import pptxgen from "pptxgenjs";

const SLIDE_W = 1280;
const SLIDE_H = 720;
const PX_PER_INCH = 96;
const SINGLE_LINE_WIDTH_BUFFER = 1.05;
const RESOURCE_LOAD_TIMEOUT = 8000;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage() {
  console.log(`Usage: html-to-pptx.js [options] <slide1.html> [slide2.html ...]

Options:
  --output, -o <file>   Output PPTX file path (default: output.pptx)
  --help, -h            Show this help message`);
  process.exit(0);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let output = "output.pptx";
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") usage();
    if (args[i] === "--output" || args[i] === "-o") { output = args[++i]; continue; }
    files.push(args[i]);
  }
  if (files.length === 0) { console.error("Error: No HTML files specified."); usage(); }
  return { output, files };
}

// ---------------------------------------------------------------------------
// Validation (runs inside Puppeteer page context)
// ---------------------------------------------------------------------------

function validatePageDOM() {
  const errors = [];
  const warnings = [];
  const root = document.body.firstElementChild;
  if (!root) {
    errors.push("No root element found in <body>.");
    return { errors, warnings };
  }

  const rect = root.getBoundingClientRect();
  if (Math.round(rect.width) !== 1280 || Math.round(rect.height) !== 720) {
    errors.push(`Root element is ${Math.round(rect.width)}x${Math.round(rect.height)}, must be 1280x720.`);
  }

  // Overflow detection — check each axis independently
  const rootCS = window.getComputedStyle(root);
  const ovX = rootCS.overflowX;
  const ovY = rootCS.overflowY;
  if (ovX !== "hidden" && ovX !== "clip" && root.scrollWidth > Math.round(rect.width) + 1) {
    errors.push(`Content overflows horizontally: scrollWidth=${root.scrollWidth}px > width=${Math.round(rect.width)}px. Add overflow:hidden or reduce content.`);
  }
  if (ovY !== "hidden" && ovY !== "clip" && root.scrollHeight > Math.round(rect.height) + 1) {
    errors.push(`Content overflows vertically: scrollHeight=${root.scrollHeight}px > height=${Math.round(rect.height)}px. Add overflow:hidden or reduce content.`);
  }

  const ALLOWED = new Set([
    "DIV", "TABLE", "TR", "TD", "TH", "TBODY", "THEAD", "TFOOT",
    "H1", "H2", "H3", "H4", "H5", "H6", "P", "LI",
    "SPAN", "B", "I", "U",
    "UL", "OL",
    "IMG",
    "BR",
  ]);

  const walk = (el) => {
    if (el.nodeType === Node.ELEMENT_NODE) {
      if (!ALLOWED.has(el.tagName)) {
        errors.push(`Element <${el.tagName.toLowerCase()}> is not allowed. Use only: div, h1-h6, p, img, span, b, i, u, ul, ol, li, table, tr, td, th`);
      }
      if (el.tagName === "DIV" || el.tagName === "TABLE" || el.tagName === "TR" ||
          el.tagName === "TBODY" || el.tagName === "THEAD" || el.tagName === "TFOOT" ||
          el.tagName === "UL" || el.tagName === "OL") {
        for (const child of el.childNodes) {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            errors.push(`<${el.tagName.toLowerCase()}> contains bare text "${child.textContent.trim().slice(0, 40)}". Wrap text in <p>, <h*>, or <li>.`);
          }
        }
      }
    }
    for (const child of el.children) walk(child);
  };
  walk(root);

  const textEls = root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,td,th,span,b,i,u");
  const warnedProps = new Set();
  for (const el of textEls) {
    const cs = window.getComputedStyle(el);
    if (cs.textShadow && cs.textShadow !== "none" && !warnedProps.has("text-shadow")) {
      warnings.push(`text-shadow is not supported in PPTX text and will be lost.`);
      warnedProps.add("text-shadow");
    }
    if (cs.webkitBackgroundClip === "text" && !warnedProps.has("background-clip")) {
      warnings.push(`background-clip:text is not supported in PPTX and will cause artifacts.`);
      warnedProps.add("background-clip");
    }
    const stroke = cs.webkitTextStroke || cs.webkitTextStrokeWidth || "";
    if (stroke && !stroke.startsWith("0") && !warnedProps.has("text-stroke")) {
      warnings.push(`-webkit-text-stroke is not supported in PPTX and will cause artifacts.`);
      warnedProps.add("text-stroke");
    }
    if (cs.fontVariant && cs.fontVariant !== "normal" && !warnedProps.has("font-variant")) {
      warnings.push(`font-variant:${cs.fontVariant} cannot be mapped to PPTX.`);
      warnedProps.add("font-variant");
    }
    if (cs.writingMode && cs.writingMode !== "horizontal-tb" && !warnedProps.has("writing-mode")) {
      warnings.push(`writing-mode:${cs.writingMode} is not supported; use CSS transform:rotate() instead.`);
      warnedProps.add("writing-mode");
    }
  }

  // Font check
  const declaredFont = rootCS.fontFamily;
  const firstTextEl = root.querySelector("h1,h2,h3,h4,h5,h6,p,li,td,th");
  if (firstTextEl) {
    const resolvedFont = window.getComputedStyle(firstTextEl).fontFamily;
    const declared = declaredFont.split(",").map(f => f.trim().replace(/['"]/g, "").toLowerCase());
    const resolved = resolvedFont.split(",").map(f => f.trim().replace(/['"]/g, "").toLowerCase());
    const genericFonts = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);
    const declaredSpecific = declared.filter(f => !genericFonts.has(f));
    if (declaredSpecific.length > 0) {
      const matched = declaredSpecific.some(f => resolved.some(r => r.includes(f) || f.includes(r)));
      if (!matched) {
        errors.push(`Font mismatch: declared "${declaredFont}" but resolved to "${resolvedFont}". Is the font installed?`);
      }
    }
  }

  const allImgs = root.querySelectorAll("img");
  for (const img of allImgs) {
    if (!img.complete || img.naturalWidth === 0) {
      errors.push(`<img> failed to load: src="${img.src}"`);
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Text extraction (runs inside Puppeteer page context)
// ---------------------------------------------------------------------------

function extractTextElements() {
  const TEXT_ELEMENTS = new Set([
    "H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "TD", "TH",
  ]);
  const INLINE_TAGS = new Set(["SPAN", "B", "I", "U", "BR"]);

  const result = [];
  const warnings = [];
  const root = document.body.firstElementChild;
  if (!root) return { elements: result, warnings };

  const rootRect = root.getBoundingClientRect();

  function applyTextTransform(text, transform) {
    if (!transform || transform === "none") return text;
    if (transform === "uppercase") return text.toUpperCase();
    if (transform === "lowercase") return text.toLowerCase();
    if (transform === "capitalize") return text.replace(/\b\w/g, c => c.toUpperCase());
    return text;
  }

  function getRotation(cs) {
    const transform = cs.transform;
    if (!transform || transform === "none") return 0;
    const m = transform.match(/matrix\(([^)]+)\)/);
    if (m) {
      const values = m[1].split(",").map(parseFloat);
      const angle = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
      return ((angle % 360) + 360) % 360;
    }
    const r = transform.match(/rotate\(([-\d.]+)deg\)/);
    if (r) {
      const angle = Math.round(parseFloat(r[1]));
      return ((angle % 360) + 360) % 360;
    }
    return 0;
  }

  function hasTextElementDescendant(el) {
    for (const child of el.children) {
      if (TEXT_ELEMENTS.has(child.tagName)) return true;
      if (hasTextElementDescendant(child)) return true;
    }
    return false;
  }

  function extractRuns(el, inheritedTransform) {
    const runs = [];
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent.replace(/\s+/g, " ");
        if (text.length === 0 || text === " ") continue;
        const cs = window.getComputedStyle(el);
        const tt = inheritedTransform || cs.textTransform;
        text = applyTextTransform(text, tt);
        const fw = parseInt(cs.fontWeight, 10);
        runs.push({
          text,
          bold: (fw >= 700) || el.tagName === "B",
          italic: cs.fontStyle === "italic" || el.tagName === "I",
          underline: cs.textDecorationLine.includes("underline") || el.tagName === "U",
          strikethrough: cs.textDecorationLine.includes("line-through"),
          color: cs.color,
          fontSize: parseFloat(cs.fontSize),
          letterSpacing: parseFloat(cs.letterSpacing) || 0,
        });
      } else if (node.nodeType === Node.ELEMENT_NODE && INLINE_TAGS.has(node.tagName)) {
        if (node.tagName === "BR") {
          runs.push({ text: "\n", br: true });
          continue;
        }
        const cs = window.getComputedStyle(node);
        const tt = cs.textTransform !== "none" ? cs.textTransform : inheritedTransform;
        const childRuns = extractRuns(node, tt);
        const fw = parseInt(cs.fontWeight, 10);
        for (const r of childRuns) {
          runs.push({
            text: r.text,
            bold: r.bold || (fw >= 700) || node.tagName === "B",
            italic: r.italic || cs.fontStyle === "italic" || node.tagName === "I",
            underline: r.underline || cs.textDecorationLine.includes("underline") || node.tagName === "U",
            strikethrough: r.strikethrough || cs.textDecorationLine.includes("line-through"),
            color: r.color !== undefined ? r.color : cs.color,
            fontSize: r.fontSize !== undefined ? r.fontSize : parseFloat(cs.fontSize),
            // Explicit zero from child overrides non-zero parent
            letterSpacing: r.letterSpacing !== undefined ? r.letterSpacing : (parseFloat(cs.letterSpacing) || 0),
          });
        }
      }
    }
    return runs;
  }

  function walk(el) {
    if (el.nodeType !== Node.ELEMENT_NODE) return;

    if (TEXT_ELEMENTS.has(el.tagName)) {
      if (el.tagName === "LI" && hasTextElementDescendant(el)) {
        for (const child of el.children) walk(child);
        return;
      }

      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      const lineHeight = parseFloat(cs.lineHeight) || fontSize * 1.2;
      const isSingleLine = rect.height <= lineHeight * 1.5;

      const textTransform = cs.textTransform;
      const runs = extractRuns(el, textTransform !== "none" ? textTransform : null);
      if (runs.length > 0 && !runs[0].br) runs[0].text = runs[0].text.replace(/^\s+/, "");
      if (runs.length > 0 && !runs[runs.length - 1].br) runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
      if (runs.length === 0 || runs.every(r => r.br || r.text.trim() === "")) return;

      let bulletType = null;
      let bulletIndent = 0;
      let bulletStartAt = 1;
      if (el.tagName === "LI") {
        const list = el.parentElement;
        bulletType = list && list.tagName === "OL" ? "number" : "bullet";
        bulletIndent = parseFloat(cs.paddingLeft) || 0;
        if (bulletType === "number") {
          const siblings = Array.from(list.children).filter(c => c.tagName === "LI");
          bulletStartAt = siblings.indexOf(el) + 1;
        }
      }

      const rotation = getRotation(cs);
      if (rotation !== 0 && rotation !== 90 && rotation !== 180 && rotation !== 270) {
        warnings.push(`Text element "${runs[0]?.text?.slice(0, 20) || ""}" has rotation ${rotation}° which may not position accurately in PPTX. Only 0°/90°/180°/270° are reliable.`);
      }

      // Content-box measurement: subtract padding from bounding rect
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      const padLeft = parseFloat(cs.paddingLeft) || 0;

      let x = rect.left - rootRect.left + padLeft;
      let y = rect.top - rootRect.top + padTop;
      let w = rect.width - padLeft - padRight;
      let h = rect.height - padTop - padBottom;

      if (rotation === 90 || rotation === 270) {
        const cx = (rect.left - rootRect.left) + rect.width / 2;
        const cy = (rect.top - rootRect.top) + rect.height / 2;
        x = cx - h / 2;
        y = cy - w / 2;
        const tmp = w;
        w = h;
        h = tmp;
      }

      result.push({
        tag: el.tagName,
        x, y, w, h,
        isSingleLine,
        textAlign: cs.textAlign === "start" ? "left" : cs.textAlign === "end" ? "right" : cs.textAlign,
        lineHeight: parseFloat(cs.lineHeight) || undefined,
        fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
        marginTop: parseFloat(cs.marginTop) || 0,
        marginBottom: parseFloat(cs.marginBottom) || 0,
        runs,
        bulletType,
        bulletIndent,
        bulletStartAt,
        rotation: rotation || undefined,
      });
      return;
    }

    for (const child of el.children) walk(child);
  }

  walk(root);
  return { elements: result, warnings };
}

// ---------------------------------------------------------------------------
// Color conversion
// ---------------------------------------------------------------------------

function cssColorToHex(color) {
  if (!color) return "000000";
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    return (r + g + b).toUpperCase();
  }
  if (color.startsWith("#")) return color.slice(1).toUpperCase();
  return "000000";
}

function cssColorAlpha(color) {
  if (!color) return 0;
  const m = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  if (m) {
    const a = parseFloat(m[1]);
    return Math.round((1 - a) * 100);
  }
  return 0;
}

function pxToPt(px) {
  return px * 0.75;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { output, files } = parseArgs(process.argv);

  console.log(`Converting ${files.length} slide(s) → ${output}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
      "--disable-lcd-text",
    ],
  });

  const pptx = new pptxgen();
  pptx.defineLayout({ name: "CUSTOM_16x9", width: SLIDE_W / PX_PER_INCH, height: SLIDE_H / PX_PER_INCH });
  pptx.layout = "CUSTOM_16x9";

  let hasErrors = false;

  for (let i = 0; i < files.length; i++) {
    const filePath = resolve(files[i]);
    const fileName = basename(filePath);
    console.log(`\n[${i + 1}/${files.length}] ${fileName}`);

    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: 2 });

    const fileUrl = `file://${filePath}`;
    try {
      await page.goto(fileUrl, { waitUntil: "load", timeout: 15000 });
      // Wait for fonts and images, with a hard timeout to prevent hangs
      await page.evaluate((timeout) => Promise.race([
        Promise.all([
          document.fonts.ready,
          ...Array.from(document.querySelectorAll("img")).map(img =>
            img.complete ? Promise.resolve() :
            new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
          ),
        ]),
        new Promise(resolve => setTimeout(resolve, timeout)),
      ]), RESOURCE_LOAD_TIMEOUT);
    } catch (e) {
      console.error(`  ✗ Failed to load ${fileName}: ${e.message}`);
      hasErrors = true;
      await page.close();
      continue;
    }

    // --- Validate ---
    console.log("  Validating...");
    const { errors: validationErrors, warnings: valWarnings } = await page.evaluate(validatePageDOM);
    for (const w of valWarnings) console.warn(`  ⚠ ${w}`);
    if (validationErrors.length > 0) {
      console.error(`  ✗ Validation failed for ${fileName}:`);
      for (const err of validationErrors) console.error(`    - ${err}`);
      hasErrors = true;
      await page.close();
      continue;
    }
    console.log("  ✓ Validation passed");

    // --- Extract text elements before modifying the page ---
    console.log("  Extracting text...");
    const { elements: textElements, warnings: extractWarnings } = await page.evaluate(extractTextElements);
    for (const w of extractWarnings) console.warn(`  ⚠ ${w}`);
    console.log(`  Found ${textElements.length} text element(s)`);

    // --- Screenshot with transparent text ---
    console.log("  Screenshotting visual layer...");
    await page.evaluate(() => {
      const style = document.createElement("style");
      style.id = "__pptx_transparent";
      style.textContent = `
        h1,h2,h3,h4,h5,h6,p,li,span,b,i,u,td,th {
          color: transparent !important;
          -webkit-text-stroke: 0 !important;
          text-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    });

    const root = await page.$("body > *:first-child");
    const screenshotBuffer = await root.screenshot({ type: "png" });

    // --- Build PPTX slide ---
    console.log("  Building PPTX slide...");
    const slide = pptx.addSlide();

    const bgBase64 = screenshotBuffer.toString("base64");
    slide.background = { data: `image/png;base64,${bgBase64}` };

    for (const el of textElements) {
      let x = el.x / PX_PER_INCH;
      let y = el.y / PX_PER_INCH;
      let w = el.w / PX_PER_INCH;
      const h = el.h / PX_PER_INCH;

      if (el.isSingleLine) {
        const extra = w * (SINGLE_LINE_WIDTH_BUFFER - 1);
        const align = el.textAlign;
        if (align === "center") {
          x -= extra / 2;
          w += extra;
        } else if (align === "right") {
          x -= extra;
          w += extra;
        } else {
          w += extra;
        }
      }

      const pptxRuns = [];
      for (const run of el.runs) {
        if (run.br) {
          pptxRuns.push({ text: "\n" });
          continue;
        }
        const runOpts = {
          fontFace: el.fontFamily,
          fontSize: Math.round(run.fontSize * 0.75),
          color: cssColorToHex(run.color),
          bold: run.bold,
          italic: run.italic,
          underline: { style: run.underline ? "sng" : "none" },
          strike: run.strikethrough ? "sngStrike" : undefined,
        };
        if (run.letterSpacing > 0) {
          runOpts.charSpacing = Math.max(1, Math.round(pxToPt(run.letterSpacing)));
        }
        const alpha = cssColorAlpha(run.color);
        if (alpha > 0) runOpts.transparency = alpha;
        pptxRuns.push({ text: run.text, options: runOpts });
      }

      if (pptxRuns.length === 0) continue;

      const maxRunFontSize = Math.max(...el.runs.filter(r => !r.br).map(r => r.fontSize));

      const textOpts = {
        x,
        y,
        w: Math.min(w, SLIDE_W / PX_PER_INCH - x),
        h,
        valign: "top",
        align: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "right" : "left",
        wrap: !el.isSingleLine,
        shrinkText: false,
        fontFace: el.fontFamily,
        margin: 0,
      };

      if (el.lineHeight) {
        textOpts.lineSpacingMultiple = el.lineHeight / (maxRunFontSize || 16);
      }

      if (el.marginTop > 0) {
        textOpts.paraSpaceBefore = pxToPt(el.marginTop);
      }
      if (el.marginBottom > 0) {
        textOpts.paraSpaceAfter = pxToPt(el.marginBottom);
      }

      if (el.bulletType === "bullet") {
        textOpts.bullet = true;
      } else if (el.bulletType === "number") {
        textOpts.bullet = { type: "number", startAt: el.bulletStartAt };
      }

      if (el.rotation) {
        textOpts.rotate = el.rotation;
      }

      slide.addText(pptxRuns, textOpts);
    }

    await page.close();
    console.log("  ✓ Slide added");
  }

  if (hasErrors) {
    console.error("\n✗ Some slides had validation errors. Fix them and re-run.");
    await browser.close();
    process.exit(1);
  }

  const outputPath = resolve(output);
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\n✓ PPTX written to ${outputPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
