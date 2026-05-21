# Content Bullets — Structured Key Points

## Purpose

Present a set of key points, arguments, or findings in a structured list format.
The workhorse slide of most decks. Each bullet should be a meaningful statement,
not a single word. The slide title (h1 or h2) frames the takeaway.

## Structure

- Slide title: a complete sentence stating the insight (action title)
- Bullet list: 3–6 items, each a concise but complete point
- Optional: a small supporting visual (icon, image) on one side

## HTML Sketch

```html
<div style="width:1280px; height:720px; display:flex; flex-direction:column;
            padding:60px 80px; background:___;">
  <h1 style="font-size:___; color:___; margin-bottom:32px;">
    Action title stating the key insight
  </h1>
  <ul style="font-size:___; color:___; line-height:1.8; padding-left:24px;">
    <li>First key point with enough detail to stand alone</li>
    <li>Second key point — be specific, not vague</li>
    <li>Third key point backed by evidence or data</li>
    <li>Fourth key point if needed</li>
  </ul>
</div>
```

### Variant: With Side Image

```html
<div style="width:1280px; height:720px; display:flex; padding:60px 80px;
            gap:40px; background:___;">
  <div style="flex:1; display:flex; flex-direction:column;">
    <h1 style="font-size:___; color:___; margin-bottom:24px;">Action title</h1>
    <ul style="font-size:___; color:___; line-height:1.8; padding-left:24px;">
      <li>Point one</li>
      <li>Point two</li>
      <li>Point three</li>
    </ul>
  </div>
  <img src="___" style="width:360px; object-fit:contain; align-self:center;" />
</div>
```

## Usage Notes

- The most common slide type. A 20-slide deck might have 8–12 of these.
- **Action titles**: the h1 should be a takeaway sentence, not a topic label.
  Good: "Customer retention improved 15% after onboarding redesign"
  Bad: "Customer Retention"
- Keep bullets to 3–6 items. More than 6 means the slide should be split.
- Each bullet should be roughly the same level of detail.
