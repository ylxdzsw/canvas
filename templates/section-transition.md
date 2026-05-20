# Section Transition — Topic Shift Signal

## Purpose

Signal a major topic shift within the deck. Create visual breathing room between
sections. Help the audience mentally reset and prepare for new content.
Can use a hero image to set emotional tone for the upcoming section.

## Structure

- Section title: large, bold, vertically centered
- Optional subtitle: a one-line preview of what this section covers
- Visual differentiation from content slides (e.g., inverted colors, full-bleed image)

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            justify-content:center; align-items:center; text-align:center;
            background:___;">
  <h1 style="font-size:___; color:___;">Section Title</h1>
  <p style="font-size:___; color:___; margin-top:12px;">What this section covers</p>
</div>
```

### Variant: Hero Image Background

```html
<div style="width:1280px; height:720px; position:relative;">
  <img src="___" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
  <div style="position:absolute; inset:0; background:rgba(0,0,0,0.45);
              display:flex; flex-direction:column; justify-content:center;
              align-items:center; text-align:center;">
    <h1 style="font-size:___; color:#fff;">Section Title</h1>
    <p style="font-size:___; color:rgba(255,255,255,0.8);">Optional subtitle</p>
  </div>
</div>
```

## Usage Notes

- Typically 3–5 per deck, one before each major section.
- Use inverted colors (dark background if content slides are light, or vice versa) to create clear visual breaks.
- Keep text minimal — this is a pause, not an information slide.
- Hero images should be thematically relevant but not too busy.
