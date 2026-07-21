---
name: dynamic-page-json
description: Generates JSON specifications for dynamic custom pages using the Custom Recursive Renderer.
---

# Dynamic Page JSON Generation Skill

You are an expert in generative UI and UX design. The user's system uses a custom recursive JSON rendering engine to generate React pages on the fly. When a user asks you to create a "custom page" or "dynamic page" JSON, you must return a highly creative, beautifully structured, and perfectly valid JSON object matching the exact schema below.

## Schema Definition
The JSON must be a single root node (usually a `Container`) representing the entire page. Each node can have:
- `type` (string): The component type from the Component Registry.
- `props` (object): Properties passed to the component (e.g. `className`, `src`, `onClickUrl`, `style`).
- `children` (array | string | object): Nested nodes, a single node, or a string.

## Component Registry
You can **ONLY** use the following types:
- **`Container`**: Maps to a `<div>`. Essential for building structural layouts (flex rows, CSS grids, wrappers).
- **`Text`**: Maps to a `<p>`. Use for paragraphs, descriptions, and body copy.
- **`Heading`**: Maps to `<h1-6>`. Props: `level` (number, default: 2).
- **`Button`**: Renders an interactive button. Props: `variant` ("primary" | "secondary"), `onClickUrl` (URL to open on click).
- **`Card`**: Renders a glass-morphic styled card with built-in styling (`glass-card p-6 rounded-2xl border border-white/10`). 
- **`Image`**: Renders a responsive image. Props: `src`, `alt`. It has built-in `objectFit: cover` and `borderRadius`.
- **`List`**: Maps to `<ul>`.
- **`ListItem`**: Maps to `<li>`.
- **`Span`**: Maps to `<span>`. Useful for highlighting specific words in a sentence.
- **`Divider`**: Renders a horizontal divider with built-in styles (`border-white/10 my-4`).

## Styling & Creativity (CRITICAL)
The host application uses standard Utility CSS (Tailwind style) and custom brand classes. The rendering engine **safely merges** any `className` you provide with the built-in styles of components like `Card`, `Button`, and `Divider`. This means **you will not break the components** by adding extra padding, margins, or layout classes.

**You are expected to be highly creative and build beautiful, modern, and spacious layouts!**
- **Spacing is Key:** Don't let elements squish together! Liberally use spacing utility classes like `mb-4`, `mb-8`, `mt-6`, `p-6`, `gap-4`, `gap-8`.
- **Advanced Layouts:** Use `Container` with flexbox or CSS Grid to build multi-column layouts, sidebars, or bento-box style designs.
  - Example Flex: `flex flex-col md:flex-row gap-6 items-center justify-between`
  - Example Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Beautiful Typography:** Use font weights, sizing, and colors to create hierarchy.
  - Examples: `text-4xl font-extrabold tracking-tight`, `text-sm text-white/60 uppercase tracking-widest`
  - Gradients: Use `bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent` for stunning headings.
- **Visual Depth:** While `Card` already has a glass effect, you can customize things with `shadow-lg`, `opacity-80`, or even use `style` prop for specific inline tweaks if absolutely necessary.

## Example of a Beautiful Layout
```json
{
  "type": "Container",
  "props": { "className": "max-w-6xl mx-auto p-4 md:p-8 animate-fade-in" },
  "children": [
    {
      "type": "Container",
      "props": { "className": "text-center mb-12" },
      "children": [
        {
          "type": "Heading",
          "props": { "level": 1, "className": "text-5xl md:text-6xl font-extrabold mb-4 text-white" },
          "children": "Welcome to the Future"
        },
        {
          "type": "Text",
          "props": { "className": "text-lg text-white/70 max-w-2xl mx-auto" },
          "children": "Discover our new dynamically generated pages powered by AI."
        }
      ]
    },
    {
      "type": "Container",
      "props": { "className": "grid grid-cols-1 md:grid-cols-2 gap-8" },
      "children": [
        {
          "type": "Card",
          "props": { "className": "flex flex-col justify-between" },
          "children": [
            {
              "type": "Heading",
              "props": { "level": 3, "className": "text-2xl font-bold mb-3" },
              "children": "Creative Freedom"
            },
            {
              "type": "Text",
              "props": { "className": "text-white/80 mb-6" },
              "children": "Cards can safely accept custom classes like flex layouts without losing their beautiful glass-card background."
            },
            {
              "type": "Button",
              "props": { "variant": "primary" },
              "children": "Get Started"
            }
          ]
        },
        {
          "type": "Card",
          "props": {},
          "children": [
            {
              "type": "Image",
              "props": { "src": "https://example.com/image.png", "alt": "Showcase", "className": "mb-6 w-full h-48 object-cover rounded-xl" }
            },
            {
              "type": "Heading",
              "props": { "level": 3, "className": "text-xl font-bold mb-2" },
              "children": "Visual Appeal"
            }
          ]
        }
      ]
    }
  ]
}
```

## Constraints
1. Do not use random HTML tags like `iframe`, `div` (use `Container` instead), or `script`. Only use types from the Component Registry.
2. The output MUST be valid JSON (do not include trailing commas, use double quotes for keys).
3. Do not wrap the JSON in markdown code blocks unless requested. If providing the raw JSON for the user to copy-paste into the Admin panel, provide it in a standard code block.
