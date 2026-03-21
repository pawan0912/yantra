# Yantra

A fast, offline dev toolbox for macOS. Built with Tauri v2 + React.

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Bun](https://bun.sh/)
- macOS (Xcode Command Line Tools)

### Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev
```

### Build

```bash
# Create a production .dmg
bun run tauri build
```

## Tech Stack

- **Tauri v2** — native macOS app shell (~8MB binary)
- **React 18** + **TypeScript** (strict mode)
- **Tailwind CSS v4** — utility-first styling
- **Lucide React** — icons
- **Vanilla JS / Web APIs** — all transforms, zero heavy deps

## Architecture

```
src/
├── components/
│   ├── layout/    # AppShell, ToolPane, CommandPalette, CopyButton
│   └── ui/        # Button, Textarea, PaneHeader, Kbd, Card, etc.
├── tools/
│   ├── registry.ts    # Tool metadata + lazy imports
│   └── <tool>/
│       ├── Tool.tsx       # React component
│       └── tool.utils.ts  # Pure transform functions
├── store/         # Clipboard, theme
├── hooks/         # useClipboard, useTheme
└── App.tsx
```

### Adding a New Tool

1. Create a directory under `src/tools/<tool-name>/`
2. Add `ToolComponent.tsx` and `tool.utils.ts`
3. Add an entry to `src/tools/registry.ts`

No changes to `App.tsx` or any other file needed.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ 1–9, 0` | Switch between tools |
| `⌘ K` | Command palette |
| `⌘ ,` | Settings |
| `Ctrl+Shift+Space` | Quick launch (global) |

## License

[MIT](LICENSE)
