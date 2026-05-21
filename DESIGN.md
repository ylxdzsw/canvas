# PPTX Slide Agent Skill — Design Document

## Overview

This project is an **agent skill** for generating PowerPoint (PPTX) presentations. It is deployed to a configuration folder (e.g. `.cursor/` or `.opencode/`) and operates within the user's workspace.

The core idea: the agent authors individual slides as **standalone HTML files**, uses the browser as a layout engine for pixel-perfect rendering, then converts to PPTX by **screenshotting the visual layer** and **extracting text as native PPTX text boxes**. This yields perfect visual fidelity while keeping text searchable and editable in PowerPoint.

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Discover    User describes topic/content.                │
│                Agent gathers requirements (audience, tone,  │
│                length, key messages, language, etc.)         │
├─────────────────────────────────────────────────────────────┤
│ 2. Design      Agent picks a theme, drafts an outline       │
│                (slide titles + brief descriptions), and      │
│                selects templates for each slide. User        │
│                confirms before proceeding.                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Build       Agent generates each slide as a standalone   │
│                HTML file in the workspace, following theme   │
│                and template guidance. Copies and patches     │
│                the deck viewer for preview.                  │
├─────────────────────────────────────────────────────────────┤
│ 4. Refine      User views the HTML deck in a browser,       │
│                requests changes. Agent edits individual      │
│                HTML files. This loop repeats until the user  │
│                is satisfied.                                 │
├─────────────────────────────────────────────────────────────┤
│ 5. Export       Agent runs the conversion script to produce  │
│                a portable PPTX with all assets embedded.     │
│                User may also print the HTML to PDF for an    │
│                pixel-accurate portable copy.                 │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
pptx-skill/
  SKILL.md                  # Skill definition: workflow, constraints, instructions
  DESIGN.md                 # This file
  themes/
    corporate-blue.md       # Example theme
    minimal-light.md
    ...
  templates/
    title-slide.md          # Example template
    section-hero.md
    content-bullets.md
    side-by-side.md
    ...
  scripts/
    deck-viewer.html        # Template HTML; agent copies + patches into workspace
    html-to-pptx.js         # Conversion script
    package.json            # Dependencies (pptxgenjs, puppeteer)
```

The agent reads skill files from the config folder. All generated output (HTML slides, patched deck viewer, final PPTX) lives in the **user's workspace**, not in this project.

## Slide HTML Specification

### Dimensions

Each slide is a standalone HTML file rendered at **1280 × 720 pixels** (16:9).

This maps directly to PowerPoint's default widescreen slide (13.333″ × 7.5″) at 96 DPI, giving a clean conversion factor: `inches = px / 96`.

### Font

All text must use **Microsoft YaHei** (`微软雅黑`). This is a hard prerequisite — the font must be installed on the system where the conversion script runs, so that the browser renders and measures text accurately.

The agent should verify font availability early and work with the user to install it if missing. No font fallback chain; YaHei is the only font in v1.

### Allowed HTML Elements

The HTML subset is constrained to keep agent output predictable and conversion reliable.

**Layout containers:**
- `div` — structural layout only, no direct text children
- `table`, `tr`, `td`, `th` — used as a layout alternative to flexbox, not mapped to native PPTX tables

**Text elements (leaf nodes for text content):**
- `h1` – `h6` — headings
- `p` — body text
- `li` — list items (inside `ul` or `ol`)

**Inline formatting (inside text elements):**
- `span` — inline styling (color, font-size, etc.)
- `b` — bold
- `i` — italic
- `u` — underline

**List containers:**
- `ul` — unordered list
- `ol` — ordered list

**Media:**
- `img` — images (raster, SVG, any format the browser supports)

### Layout Rules

- The root element of each slide must be exactly 1280 × 720.
- Layout should prefer **flexbox** on `div` elements.
- `table` is an alternative layout mechanism. Cells are measured individually and become absolutely positioned text boxes in the PPTX (not native PowerPoint tables).
- Text must only appear inside text elements (`h1`–`h6`, `p`, `li`). A `div` must not contain bare text nodes — it may only contain child elements.

### Styling Freedom

Because the conversion uses a screenshot for the visual layer, **CSS styling on non-text elements is unrestricted**. The agent may freely use:

- Backgrounds: solid colors, gradients, images
- Borders, border-radius, box-shadow
- Pseudo-elements (`::before`, `::after`) for decoration
- `clip-path`, `opacity`, CSS filters
- Any visual CSS property

The only CSS constraints apply to **text elements**: avoid `text-shadow`, `background-clip: text`, `-webkit-text-stroke`, or any effect that creates visual interaction between the text glyph and the background. These would leave artifacts when text is made transparent for the background screenshot.

## Themes

A theme is a **markdown file** describing the visual identity for a slide deck.

### Contents

- **Color palette**: primary, secondary, accent, background, and text colors. Provide hex codes as concrete values, with short descriptions of intent (e.g. `#1B2A4A — deep navy, conveys professionalism`).
- **Typography scale**: font sizes for h1, h2, h3, body text, and captions.
- **Stylistic direction**: a brief description of the overall mood and aesthetic (e.g. "clean and minimal with generous whitespace" or "bold gradients with high contrast").
- **Suggested templates**: optional list of templates that pair well with this theme.
- **Logo / header / footer guidance**: optional. A theme may describe a recurring logo placement or footer strip, but this is not enforced.

### Example Structure

```markdown
# Corporate Blue

## Mood
Professional, clean, trustworthy. Generous whitespace. Subtle gradients.

## Colors
- Primary: #1A3A5C (deep blue — titles, key accents)
- Secondary: #4A90D9 (lighter blue — subheadings, highlights)
- Accent: #F5A623 (warm amber — call-to-action, emphasis)
- Background: #FFFFFF (white — main slide background)
- Alt Background: #F0F4F8 (light gray-blue — alternate sections)
- Text: #2C2C2C (near-black — body text)
- Light Text: #FFFFFF (white — text on dark backgrounds)

## Typography
- h1: 44px, bold
- h2: 32px, bold
- h3: 24px, semibold
- Body: 18px, regular
- Caption: 14px, regular

## Suggested Templates
- title-slide
- section-hero
- content-bullets
```

## Templates

A template is a **markdown file** describing a slide archetype by its **communication purpose**, not by its mechanical layout.

### Naming Philosophy

Templates are named for the effect they achieve:
- "Section Transition via Hero Image" — not "Big Image Page"
- "Side-by-Side Comparison with Conclusion" — not "Two Column Layout"
- "Key Metric Highlight" — not "Big Number Page"

### Contents

- **Purpose**: what communication goal this slide serves.
- **Structure**: which elements are used and how they relate spatially (described in natural language or a schematic).
- **HTML sketch**: a simplified HTML skeleton showing the element hierarchy and suggested CSS approach. This is guidance, not a rigid template — the agent adapts it to the theme and content.
- **Usage notes**: when to use this template, how many per deck is typical, what pitfalls to avoid.

### Example

```markdown
# Section Transition via Hero Image

## Purpose
Signal a major topic shift. Create visual breathing room between sections.
Set the emotional tone for the upcoming content.

## Structure
- Full-bleed background image that represents the new section's theme
- Semi-transparent overlay for text contrast
- Section title: large, bold, vertically centered
- Optional subtitle: smaller, below the title

## HTML Sketch
  <div style="width:1280px; height:720px; position:relative;">
    <img style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.4);
                display:flex; flex-direction:column; justify-content:center; align-items:center;">
      <h1 style="color:#fff; font-size:48px;">Section Title</h1>
      <p style="color:rgba(255,255,255,0.8); font-size:20px;">Optional subtitle</p>
    </div>
  </div>

## Usage Notes
- Typically one per major section (3–5 per deck).
- Choose images that are thematically relevant but not too busy.
- Keep text minimal — this slide is a visual pause, not an information dump.
```

### Theme–Template Relationship

Themes and templates have a **weak connection**. A theme may suggest certain templates, and a template's HTML sketch may reference theme color variables, but any template should be usable with any theme. The agent is responsible for applying the theme's colors and typography to the template's structure.

## Conversion Pipeline: HTML → PPTX

### Strategy: Screenshot Background + Native Text

Instead of reconstructing every CSS visual property as PPTX shapes (which is fragile and lossy), the conversion uses a **two-layer approach**:

1. **Visual layer**: screenshot the slide with all text made transparent → becomes the slide's background image. This captures all backgrounds, gradients, shadows, borders, images, and decorative elements with perfect fidelity.

2. **Text layer**: measure each text element's bounding box and computed styles via the DOM → create native pptxgenjs text boxes at those positions. Text remains searchable, selectable, and editable in PowerPoint.

### Conversion Steps

```
For each HTML slide:

  1. VALIDATE
     - Open in Puppeteer at 1280×720 viewport
     - Check: only allowed elements present
     - Check: no bare text nodes inside <div>
     - Check: font resolves to Microsoft YaHei
     - Check: root element is 1280×720
     - Fail fast with clear error messages on any violation

  2. SCREENSHOT VISUAL LAYER
     - Inject CSS: make all text-bearing elements' color transparent
       (h1–h6, p, li, span, b, i, u, td, th)
     - Screenshot the full page at 1280×720 → PNG buffer

  3. EXTRACT TEXT
     - Remove injected CSS (restore original rendering)
     - Walk the DOM for all text elements
     - For each text element:
       a. getBoundingClientRect() → x, y, width, height
       b. getComputedStyle() → color, fontSize, fontWeight,
          fontStyle, textDecoration, textAlign, lineHeight
       c. innerText → text content
       d. For elements with inline children (span, b, i, u):
          extract per-run styling for pptxgenjs text runs
       e. Detect single-line vs multi-line:
          if element height ≈ lineHeight → single line

  4. BUILD PPTX SLIDE
     - Set slide background to the screenshot image
     - For each text element:
       - Convert px to inches (÷ 96)
       - If single-line: width × 1.05 (5% buffer)
       - If multi-line: use measured width and height as-is
       - Create pptxgenjs text box with:
         position (x, y), size (w, h),
         text content (with runs for inline formatting),
         font family (Microsoft YaHei), font size, color,
         bold/italic/underline, text alignment
     - For <ul>/<ol> lists: use pptxgenjs native bullet support
       with measured position and size of the list container

  5. FINALIZE
     - Embed all images as binary data in the PPTX
     - Write the .pptx file
```

### Tables as Layout

`<table>` is treated as a layout mechanism, not mapped to native PPTX tables. Each `<td>`/`<th>` cell is measured individually:
- The cell's bounding box determines a text box position/size.
- Cell background colors are captured in the visual-layer screenshot.
- The result is a set of absolutely positioned text boxes that visually reproduce the table layout.

### Validation Rules (Fail-Fast)

The script validates each HTML before conversion and reports clear, actionable errors:

| Rule | Error message pattern |
|---|---|
| Disallowed element found | `Element <xyz> at line N is not allowed. Use only: div, h1–h6, p, img, span, b, i, u, ul, ol, li, table, tr, td, th` |
| Bare text inside `<div>` | `<div> at line N contains bare text "...". Wrap text in <p> or <h*>` |
| Root not 1280×720 | `Root element is WxH, must be 1280x720` |
| Font fallback detected | `Element at line N resolved to font "X", expected "Microsoft YaHei". Is the font installed?` |
| Image failed to load | `<img> at line N failed to load: src="..."` |

### Text Reflow Heuristic

PowerPoint's text rendering differs slightly from the browser's. To mitigate:
- **Single-line text boxes**: add 5% extra width. This prevents the text from wrapping to a second line in PowerPoint due to minor font metric differences.
- **Multi-line text boxes**: use measured dimensions as-is. Accept that PowerPoint may reflow lines slightly differently within the same bounding box.

Single-line detection: compare the element's `offsetHeight` to its computed `lineHeight`. If they are approximately equal (within a small tolerance), it's a single line.

### Output

The PPTX is fully **portable**: all images (from URLs, local files, or screenshots) are embedded as binary data. No external file references. The user can email or upload the PPTX and it will render correctly on any system with Microsoft YaHei installed.

## Deck Viewer

### Purpose

A lightweight HTML file for previewing the slide deck in a browser during the authoring loop (workflow step 4). This is not a presentation tool — the PPTX is the delivery artifact.

### Design

The viewer is a **template HTML file** that lives in the skill's `scripts/` directory. The agent copies it into the workspace and patches the slide list. It does not require any build tools or servers.

The template contains a placeholder:

```javascript
const slides = [/* SLIDE_LIST */];
```

The agent replaces it with the actual file list:

```javascript
const slides = ["01-title.html", "02-agenda.html", "03-intro.html"];
```

### Features

- Displays slides in `<iframe>` elements at 1280×720, scaled (via CSS `transform: scale()`) to fit the browser viewport.
- Arrow key navigation (← previous, → next).
- Slide counter indicator (e.g. "3 / 12").
- Each iframe is fully isolated — styles in one slide cannot leak into another.

### Non-Features (by design)

- No presenter notes
- No thumbnail strip
- No animations or transitions
- No full-screen mode

## Technology Stack

| Component | Technology |
|---|---|
| Slide rendering & measurement | Puppeteer (headless Chromium) |
| PPTX generation | pptxgenjs |
| Runtime | Node.js |
| Slide authoring | Plain HTML + inline CSS |
| Theme/template definitions | Markdown |
| Deck preview | Static HTML + vanilla JS |

## Scope & Constraints (v1)

### In scope
- 16:9 slides at 1280×720
- Microsoft YaHei font (single font)
- HTML elements: div, h1–h6, p, img, span, b, i, u, ul, ol, li, table, tr, td, th
- Screenshot-based visual conversion + native text extraction
- Embedded portable PPTX output
- Theme and template system in markdown
- Deck viewer for browser preview

### Out of scope (v1)
- Animations and transitions
- `pre`/`code` blocks and monospace fonts
- 4:3 or other aspect ratios
- Native PPTX tables
- Multiple fonts / font fallback chains
- Slide master / enforced headers and footers
- Hierarchical element screenshots (Variant B/C)
- Presenter notes
