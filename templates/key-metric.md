# Key Metric Highlight — Impactful Number

## Purpose

Make a single number or statistic impossible to ignore. Used when one data point
is the slide's entire message. The number should be large enough to read from the
back of the room. Supporting context explains what the number means and why it matters.

## Structure

- The metric: extremely large, bold, center-dominant
- Unit or label: adjacent to the number, smaller
- Context line: one sentence explaining significance
- Optional: trend indicator or comparison to a baseline

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            justify-content:center; align-items:center; text-align:center;
            padding:60px; background:___;">
  <p style="font-size:___; color:___; margin-bottom:8px;">Metric Label</p>
  <h1 style="font-size:120px; color:___;">87%</h1>
  <p style="font-size:___; color:___; margin-top:16px; max-width:600px;">
    One sentence of context explaining why this number matters
    and what action it implies.
  </p>
</div>
```

### Variant: Multiple Metrics (2–3)

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            padding:60px 80px; background:___;">
  <h1 style="font-size:___; color:___; margin-bottom:40px;">
    Action title about the metrics
  </h1>
  <div style="display:flex; gap:40px; flex:1; align-items:center;">
    <div style="flex:1; text-align:center;">
      <h2 style="font-size:72px; color:___;">42%</h2>
      <p style="font-size:___; color:___;">Metric A description</p>
    </div>
    <div style="flex:1; text-align:center;">
      <h2 style="font-size:72px; color:___;">3.2x</h2>
      <p style="font-size:___; color:___;">Metric B description</p>
    </div>
    <div style="flex:1; text-align:center;">
      <h2 style="font-size:72px; color:___;">$1.4B</h2>
      <p style="font-size:___; color:___;">Metric C description</p>
    </div>
  </div>
</div>
```

## Usage Notes

- Use for the single most important number in each section.
- The metric font size should be dramatically larger than body text (3–5x).
- Don't overuse — if every slide has a giant number, none stand out. 1–3 per deck.
- Always provide context. A number without explanation is meaningless.
