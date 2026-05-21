# pptx-canvas

An **agent skill** that turns a coding agent into a slide designer.

The agent authors each slide as a standalone HTML file, previews the deck in a
browser, and exports a portable **PPTX** (or PDF) with text that stays
searchable and editable in PowerPoint.

Drop the folder into `.cursor/`, `.claude/`, `.opencode/`, or any agent
config dir that loads `SKILL.md`, and ask your agent to make a deck.

## Why HTML?

Reconstructing CSS as native PPTX shapes is fragile and lossy — gradients,
shadows, pseudo-elements, and clip-paths break the moment you leave the
browser. Existing HTML→PPTX converters cope by banning most of CSS, which
leaves agents with a sandbox too small to design in.

`pptx-canvas` takes the opposite trade-off and uses the browser as the layout
engine. Agents write idiomatic HTML + inline CSS — flexbox, gradients,
absolute positioning, the works — and the conversion script does the rest.

## The two-layer trick

The converter renders each slide in headless Chromium and splits it in two:

1. **Visual layer** — every text node is made `color: transparent`, the page
   is screenshotted at 2× resolution, and the PNG becomes the slide's
   background. Backgrounds, gradients, shadows, borders, decorative SVGs and
   images all survive pixel-perfectly because they were never re-rendered —
   they were photographed.
2. **Text layer** — the original DOM is walked to measure each text element's
   bounding box, computed font, color, weight, alignment and inline runs.
   Those become native pptxgenjs text boxes positioned on top of the
   background.

The result: a PPTX that looks like the HTML and behaves like a PowerPoint
file. Click any heading or bullet, edit the words, change the font — it's
real text, not a screenshot.

## What's in the box

- `SKILL.md` — the workflow the agent follows (discover → design → build →
  refine → export).
- `themes/` — opinionated color/typography systems (`mckinsey`, `huawei`,
  `nvidia`). Markdown, not code.
- `templates/` — slide archetypes named by communication purpose
  (`section-transition`, `key-metric`, `side-by-side`, …), not by mechanical
  layout.
- `scripts/scaffold.html` — the boilerplate every slide starts from
  (1280×720, Microsoft YaHei, overflow:hidden).
- `scripts/html-to-pptx.js` — the converter. Validates HTML, fails fast with
  actionable errors, embeds all images for a portable output.
- `scripts/deck-viewer.html` — a no-build browser preview with arrow-key
  navigation and a print-to-PDF mode.
- `test/` — nine reference slides that exercise the full feature surface
  (titles, bullets, tables, ordered lists, mixed inline styling, …) and
  double as the CI fixture.

## Quick try

```bash
cd scripts
npm install
node html-to-pptx.js -o ../test/output.pptx ../test/*.html
```

Open `test/output.pptx` in PowerPoint, Keynote, or LibreOffice Impress.

The converter requires the **Microsoft YaHei** font to be installed. Obtain it
from [fernvenue/microsoft-yahei](https://github.com/fernvenue/microsoft-yahei)
and install the TTC files on your system font path.

## Design philosophy

The agent's job is design, not bookkeeping. The skill removes the
bookkeeping — boilerplate, conversion, validation, preview — so the agent
can spend its tokens on the slides.

`SKILL.md` is the contract the agent reads; everything else in this repo
exists to make that contract easy to honor.
