# Yantra — Development Guidelines

## Coding Conventions

- **TypeScript strict mode** — `"strict": true` in tsconfig
- **Named exports only** — no default exports
- **kebab-case** for all file and directory names
- **PascalCase** for component names
- Each tool's transform logic in a separate `.utils.ts` file — independently testable without React
- **No heavy dependencies** — prefer Web APIs and vanilla JS for transforms
- **2+ function parameters** → use named destructured arguments: `func({ a, b })`
- **Union types** over enums, `as const` for constant maps
- **Explicit return types** on all functions
- Keep components under 100 lines — extract sub-components when larger
- Use inline styles (not Tailwind classes) inside `dangerouslySetInnerHTML` — Tailwind won't scan dynamic HTML

## UI Primitives

Shared components live in `src/components/ui/` and are importable via barrel:

```ts
import { Button, Textarea, PaneHeader, Kbd, Card, SectionTitle } from "../ui";
```

- **Button** — variants: `primary`, `secondary`, `icon`, `small` + `active` state
- **Textarea** — consistent font, size, placeholder styling
- **PaneHeader** — `h-7` uppercase label header for panes
- **Kbd** — keyboard shortcut badge, variants: `inline`, `contained`
- **Card** — rounded container with optional `divided` prop
- **SectionTitle** — heading with optional subtitle

Use these instead of inline Tailwind for repeated patterns.

## Tool Pattern

Every tool follows this structure:

```
src/tools/<tool-name>/
├── ToolComponent.tsx    # React component using ToolPane or custom layout
└── tool.utils.ts        # Pure functions, no React, no side effects
```

Register in `src/tools/registry.ts` with: `id`, `name`, `icon` (Lucide component), `shortcut`, `component` (lazy), `description`, `tags`, `matchClipboard`.

## Icons

All icons use [Lucide React](https://lucide.dev/) — tree-shaken, inline SVGs, works offline. No emojis, no inline SVGs.

## macOS Window

- `titleBarStyle: "Overlay"` with `hiddenTitle: true`
- Traffic light position: `{ x: 12, y: 20 }` in `tauri.conf.json`
- `--traffic-light-inset: 78px` CSS variable for content offset
- `--titlebar-height: 38px` CSS variable for title bar height
- `data-tauri-drag-region` on draggable areas
- `-webkit-app-region: drag` CSS required for drag to work

## Out of Scope

- Windows / Linux builds (Tauri supports it, don't configure yet)
- Cloud sync or shared snippet library
- Network requests or external APIs (all transforms are local)
- Authentication / accounts
- Backend server
