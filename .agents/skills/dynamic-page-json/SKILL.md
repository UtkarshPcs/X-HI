---
name: dynamic-page-json
description: Generates JSON specifications for dynamic custom pages using the Custom Recursive Renderer.
---

# Dynamic Page JSON Generation Skill

You are an expert in generative UI. The user's system uses a custom recursive JSON renderer to generate React pages on the fly. When a user asks you to create a "custom page" or "dynamic page" JSON, you must return a valid JSON object matching the exact schema below.

## Schema Definition
The JSON must be a single root node (usually a `Container`) representing the entire page. Each node can have:
- `type` (string): The component type from the Component Registry.
- `props` (object): Properties passed to the component (e.g. `className`, `src`, `onClickUrl`).
- `children` (array | string | object): Nested nodes, a single node, or a string.

Example:
```json
{
  "type": "Container",
  "props": { "className": "page-transition fade-in max-w-4xl mx-auto" },
  "children": [
    {
      "type": "Heading",
      "props": { "level": 1, "className": "text-4xl font-bold mb-6 text-gradient" },
      "children": "Welcome to our Page"
    },
    {
      "type": "Card",
      "props": {},
      "children": [
        {
          "type": "Text",
          "props": { "className": "text-white/80 mb-4" },
          "children": "This is a beautifully rendered custom card."
        },
        {
          "type": "Button",
          "props": { "variant": "primary", "onClickUrl": "https://example.com" },
          "children": "Learn More"
        }
      ]
    }
  ]
}
```

## Component Registry
You can **ONLY** use the following types:
- **`Container`**: Maps to a `<div>`. Useful for layouts.
- **`Text`**: Maps to a `<p>`. Use for paragraphs.
- **`Heading`**: Maps to `<h1-6>`. Props: `level` (number, default: 2).
- **`Button`**: Renders an interactive button. Props: `variant` ("primary" | "secondary"), `onClickUrl` (URL to open on click).
- **`Card`**: Renders a glass-morphic styled card (`<div className="glass-card p-6 rounded-2xl border border-white/10">`).
- **`Image`**: Renders a responsive image. Props: `src`, `alt`.
- **`List`**: Maps to `<ul>`.
- **`ListItem`**: Maps to `<li>`.
- **`Span`**: Maps to `<span>`.
- **`Divider`**: Renders a horizontal divider `<hr className="border-white/10 my-4" />`.

## Styling & CSS Classes
The host application uses standard Utility CSS and custom brand classes. You should extensively use `className` in the `props` to style the output.
- Text: `text-white/60`, `text-white/80`, `text-center`, `font-bold`, `text-3xl`
- Colors: `text-gradient` (for primary titles), `text-blue-400`
- Spacing: `mb-4`, `mt-6`, `p-4`, `py-8`, `gap-4`
- Flexbox: `flex`, `flex-col`, `items-center`, `justify-center`, `justify-between`
- Brand classes: `as-card`, `auth-btn`, `glass-card`

## Constraints
1. Do not use random HTML tags like `iframe` or `script`. Only use types from the Component Registry.
2. The output MUST be valid JSON (do not include trailing commas).
3. Do not wrap the JSON in markdown code blocks unless requested. If providing the raw JSON for the user to copy-paste into the Admin panel, provide it in a code block.
