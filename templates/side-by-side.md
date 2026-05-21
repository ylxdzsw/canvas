# Side-by-Side Comparison with Conclusion

## Purpose

Compare two (or occasionally three) options, approaches, scenarios, or time periods.
Draw a clear conclusion about what the comparison reveals. Useful for before/after,
pros/cons, option A vs. option B, or current vs. proposed state.

## Structure

- Slide title: states the comparison's conclusion
- Two columns of equal width, each with a header and supporting points
- Optional: a bottom row with the overall conclusion or recommendation

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            padding:60px 80px; background:___;">
  <h1 style="font-size:___; color:___; margin-bottom:32px;">
    Conclusion from the comparison
  </h1>
  <div style="display:flex; gap:40px; flex:1;">
    <div style="flex:1; display:flex; flex-direction:column;">
      <h2 style="font-size:___; color:___; margin-bottom:16px;">Option A</h2>
      <ul style="font-size:___; color:___; line-height:1.7; padding-left:20px;">
        <li>Characteristic one</li>
        <li>Characteristic two</li>
        <li>Characteristic three</li>
      </ul>
    </div>
    <div style="flex:1; display:flex; flex-direction:column;">
      <h2 style="font-size:___; color:___; margin-bottom:16px;">Option B</h2>
      <ul style="font-size:___; color:___; line-height:1.7; padding-left:20px;">
        <li>Characteristic one</li>
        <li>Characteristic two</li>
        <li>Characteristic three</li>
      </ul>
    </div>
  </div>
  <p style="font-size:___; color:___; margin-top:24px; padding-top:16px;
            border-top:1px solid ___;">
    Summary conclusion or recommendation
  </p>
</div>
```

## Usage Notes

- Keep columns balanced in content length.
- Use consistent phrasing across columns so differences stand out.
- The conclusion row is critical — don't just compare, conclude.
- For three-way comparison, use three columns but reduce font sizes accordingly.
