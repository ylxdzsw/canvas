# Product Hero — Visual Showcase

## Purpose

Give a product, feature, or visual asset center stage. The image dominates the slide;
text is minimal and supporting. Used for product launches, feature reveals, or
any moment where "showing" is more powerful than "telling."

## Structure

- Hero image: large, high-quality, visually dominant
- Product name or feature title: bold, positioned to complement the image
- One-line description or tagline
- Optional: 2–3 spec callouts or feature badges

## HTML Sketch

```html
<div style="width:1280px; height:720px; position:relative; background:___;">
  <img src="___" style="position:absolute; right:0; top:50%; transform:translateY(-50%);
                        height:80%; object-fit:contain;" />
  <div style="position:absolute; left:80px; top:50%; transform:translateY(-50%);
              max-width:500px;">
    <h1 style="font-size:___; color:___;">Product Name</h1>
    <p style="font-size:___; color:___; margin-top:12px;">
      One-line tagline or description
    </p>
  </div>
</div>
```

### Variant: Centered Product with Specs Below

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            align-items:center; padding:40px 80px; background:___;">
  <img src="___" style="height:380px; object-fit:contain;" />
  <h1 style="font-size:___; color:___; margin-top:24px;">Product Name</h1>
  <div style="display:flex; gap:60px; margin-top:20px;">
    <p style="font-size:___; color:___; text-align:center;">
      <b style="color:___;">Spec 1</b><br/>Value
    </p>
    <p style="font-size:___; color:___; text-align:center;">
      <b style="color:___;">Spec 2</b><br/>Value
    </p>
    <p style="font-size:___; color:___; text-align:center;">
      <b style="color:___;">Spec 3</b><br/>Value
    </p>
  </div>
</div>
```

## Usage Notes

- Best on dark backgrounds where the product image can "pop."
- The image should be the highest quality available. Blurry or small images ruin this slide.
- Text is secondary — if you need more than 2–3 lines, use a different template.
- Works especially well for the Nvidia theme. McKinsey decks rarely use this format.
