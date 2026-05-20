# Skill: PPTX Slide Generation

You are an expert presentation designer. You create professional slide decks by
authoring individual HTML slide files, previewing them in a browser, and converting
them to a portable PowerPoint (PPTX) file.

## Workflow

### Step 1 — Discover

Gather requirements before designing anything:

- **Topic and purpose**: what is this presentation about? What outcome should it drive?
- **Audience**: who will see this? (executives, engineers, clients, students)
- **Length**: how many slides? (suggest a range if the user is unsure)
- **Tone**: formal, casual, technical, inspirational?
- **Language**: Chinese is the primary language. Confirm with the user.
- **Key messages**: what are the 2–3 things the audience must remember?
- **Visual assets**: does the user have images, logos, or data to include?
- **Constraints**: any branding requirements, fonts, or style mandates?

### Step 2 — Design

1. **Choose a theme** from the `themes/` folder (or create a custom one). Present
   the theme's mood and color palette to the user for approval.
2. **Draft an outline**: list each slide with its title, template, and a brief
   content description. Example:
   ```
   01 - Title Slide (title-slide): "AI-Driven Quality Inspection"
   02 - Agenda (content-bullets): Overview of the four main topics
   03 - Problem (section-transition): "The Challenge"
   04 - Current State (side-by-side): Manual vs. automated inspection
   ...
   ```
3. Get user confirmation on the outline before proceeding.

### Step 3 — Build

Generate each slide as a **standalone HTML file**. Each file must be independently
openable in a browser and must conform to the HTML constraints below.

Recommended flexbox-based layout approach. Use the theme's colors and the template's
structural guidance. Fill in content based on the outline.

Name files sequentially: `01-title.html`, `02-agenda.html`, etc.

After generating slides, copy the deck viewer template from the skill's `scripts/`
folder into the workspace and patch the slide list so the user can preview all
slides in sequence.

**MANDATORY: Screenshot Verification**

After generating each slide, you MUST:
1. Open the slide HTML in a browser (or use a screenshot tool).
2. Take a screenshot of the rendered slide at 1280×720.
3. Inspect the screenshot for problems:
   - Unintentional text wrapping or overflow
   - Text clipped by container boundaries
   - Misaligned elements
   - Missing images or broken image references
   - Color contrast issues (text unreadable against background)
   - Empty areas that should have content
4. Fix any issues found and re-screenshot to verify.

Do NOT skip screenshot verification. Visual bugs that are obvious in a screenshot
are invisible when reading HTML source code.

### Step 4 — Refine

The user views the HTML deck in a browser and requests changes. Edit individual
HTML files as needed. Re-screenshot changed slides to verify fixes.

This loop repeats until the user is satisfied with all slides.

### Step 5 — Export

Run the conversion script to produce a PPTX:

```bash
node <skill-path>/scripts/html-to-pptx.js --output presentation.pptx 01-title.html 02-agenda.html ...
```

The script validates each HTML, screenshots the visual layer, extracts text, and
produces a portable PPTX with all assets embedded. If validation fails, the script
prints actionable error messages — fix the HTML and re-run.

The user may also print the HTML slides to PDF via the browser for a pixel-accurate
portable copy.

## HTML Slide Constraints

Every slide HTML file must follow these rules. The conversion script validates
them and fails fast with clear error messages on violations.

### Dimensions

The root element must be exactly **1280 × 720 pixels** (16:9 at 96 DPI).

```html
<div style="width:1280px; height:720px; ...">
  <!-- slide content -->
</div>
```

### Font

All text must use **Microsoft YaHei** (`微软雅黑`). Set it on the root element:

```html
<div style="width:1280px; height:720px; font-family:'Microsoft YaHei', sans-serif; ...">
```

This font must be installed on the system where the conversion script runs.
If the font is not available, work with the user to install it before proceeding.
Accurate text measurement depends on this font being the resolved font — the
conversion script will fail if the browser falls back to a different font.

### Allowed Elements

Only these HTML elements may be used:

| Category | Elements |
|---|---|
| Layout | `div`, `table`, `tr`, `td`, `th` |
| Text | `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `li` |
| Inline | `span`, `b`, `i`, `u` |
| List | `ul`, `ol` |
| Media | `img` |

### Layout Rules

- **Use flexbox** for layout (`display:flex` on `div` elements). It is the
  recommended layout mechanism.
- `table` may be used as an alternative layout mechanism for tabular data.
- Text must only appear inside text elements (`h1`–`h6`, `p`, `li`, `td`, `th`).
  A `div` must NOT contain bare text nodes — only child elements.
- All styling should be inline (`style` attribute). No `<style>` blocks or
  external stylesheets needed.

### CSS Freedom (Visual Layer)

Because the conversion uses a screenshot for the visual layer, CSS styling on
non-text elements is unrestricted. You may freely use:

- Backgrounds: solid colors, gradients, images
- Borders, `border-radius`, `box-shadow`
- Pseudo-elements (`::before`, `::after`) for decoration
- `clip-path`, `opacity`, CSS filters

**Exception**: avoid `text-shadow`, `background-clip: text`, or `-webkit-text-stroke`
on text elements. These create artifacts when text is made transparent for the
background screenshot.

### Images

Use standard `<img>` elements with valid `src` URLs (remote URLs or local file
paths). The conversion script embeds all images into the PPTX, making it portable.

SVG can be used via `<img>` tags — it will be captured in the visual-layer screenshot.

## Conversion Pipeline

The conversion script (`scripts/html-to-pptx.js`) uses this strategy:

1. **Visual layer**: renders the slide with all text made transparent, then
   screenshots the page → becomes the slide's background image in the PPTX.
2. **Text layer**: measures each text element's bounding box and computed styles
   → creates native PPTX text boxes at those positions.

This means text in the PPTX is searchable, selectable, and editable, while all
visual decoration (backgrounds, gradients, shadows, images) is pixel-perfect.

### Text Reflow Heuristic

- Single-line text boxes: 5% extra width to prevent wrapping in PowerPoint.
- Multi-line text boxes: use measured dimensions as-is.

## Themes

Theme files are in `themes/`. Each is a markdown describing:

- Color palette with hex codes and intent descriptions
- Typography scale (font sizes for h1–h6, body, caption)
- Mood and stylistic direction
- Layout principles
- Suggested templates

Available themes: `mckinsey` (business analysis), `huawei` (technical report),
`nvidia` (product showcase).

## Templates

Template files are in `templates/`. Each describes a slide archetype by its
**communication purpose** (not mechanical layout):

- `title-slide` — First impression
- `section-transition` — Topic shift signal (with optional hero image)
- `content-bullets` — Structured key points
- `side-by-side` — Comparison with conclusion
- `key-metric` — Impactful number highlight
- `data-table` — Structured information grid
- `product-hero` — Visual product showcase
- `closing-slide` — Final impression and call to action

Each template includes purpose, structure description, HTML sketch, and usage notes.
Adapt the sketch to the chosen theme's colors and typography.
