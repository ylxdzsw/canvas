# Title Slide — First Impression

## Purpose

The opening slide of the deck. Establishes the presentation's topic, sets the visual
tone, and identifies the presenter or organization. Should feel confident and
uncluttered — give the audience a moment to settle in.

## Structure

- Presentation title: large, bold, prominent
- Subtitle or tagline: smaller, below the title
- Presenter name, role, date: bottom area, understated
- Optional: organization logo or thematic background image

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            justify-content:center; align-items:center; text-align:center;
            background:___; padding:60px;">
  <h1 style="font-size:___; color:___;">Presentation Title</h1>
  <p style="font-size:___; color:___; margin-top:16px;">Subtitle or tagline goes here</p>
  <p style="font-size:___; color:___; margin-top:auto;">Presenter Name · Role · Date</p>
</div>
```

## Usage Notes

- Exactly one per deck, always the first slide.
- Keep the title to one or two lines maximum.
- The subtitle should give context, not repeat the title.
- On dark themes, consider a subtle gradient or background image with overlay.
