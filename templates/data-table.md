# Data Table — Structured Information Grid

## Purpose

Present structured data, specifications, or feature comparisons in a tabular format.
Tables work well when the audience needs to cross-reference rows and columns.
The slide title should state the insight the table supports, not just "Data Table."

## Structure

- Slide title: action title stating the table's takeaway
- Table with a clear header row
- 3–6 columns, 3–8 rows (keep it readable at presentation distance)
- Optional: highlight row or cell for the key data point

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            padding:60px 80px; background:___;">
  <h1 style="font-size:___; color:___; margin-bottom:24px;">
    Action title — what the data shows
  </h1>
  <table style="width:100%; border-collapse:collapse; font-size:___;">
    <tr style="background:___;">
      <th style="padding:12px 16px; text-align:left; color:___;">Header 1</th>
      <th style="padding:12px 16px; text-align:left; color:___;">Header 2</th>
      <th style="padding:12px 16px; text-align:left; color:___;">Header 3</th>
    </tr>
    <tr style="background:___;">
      <td style="padding:12px 16px; color:___;">Data</td>
      <td style="padding:12px 16px; color:___;">Data</td>
      <td style="padding:12px 16px; color:___;">Data</td>
    </tr>
    <tr style="background:___;">
      <td style="padding:12px 16px; color:___;">Data</td>
      <td style="padding:12px 16px; color:___;">Data</td>
      <td style="padding:12px 16px; color:___;">Data</td>
    </tr>
  </table>
</div>
```

## Usage Notes

- Tables are rendered as layout in the HTML and converted to absolutely positioned
  text boxes in the PPTX (not native PPTX tables). Cell backgrounds are captured
  in the visual-layer screenshot.
- Keep column count low (3–5). Wide tables with tiny text are unreadable in presentations.
- Alternate row backgrounds for readability.
- Highlight the most important cell or row with the theme's accent color.
- If the table exceeds 8 rows, consider splitting across two slides.
