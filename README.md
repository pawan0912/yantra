# Yantra

A fast, offline dev toolbox for macOS. Built with Tauri v2 + React.

## Tools

| Category | Tools |
|----------|-------|
| **JSON** | JSON Formatter, JSON → TypeScript/Zod |
| **API** | URL Parser, cURL Converter, JWT Decoder, API Playground |
| **Text** | Base64, Diff Viewer, Regex Tester |
| **Misc** | Timestamp Converter, Color Converter |

## Features

- Native macOS app with system title bar, traffic lights, and window management
- Command palette (`⌘K`) for quick tool switching
- Collapsible sidebar grouped by category
- Resizable split panes (input/output)
- Smart clipboard detection with paste hint
- Light/Dark/System theme with persistence
- Segmented controls for mode switching, distinct from action buttons
- React Compiler enabled for automatic memoization
- Plugin-style architecture — each tool is self-contained and independently loadable
- Enable/disable tools from Settings
- API Playground with full HTTP client via Rust (bypasses CORS)
- State persists across tool switching via Jotai atoms
- 315 unit tests across all tool utilities
- Production DMG at ~3.5MB

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Bun](https://bun.sh/)
- macOS (Xcode Command Line Tools)

### Install from DMG

Download the latest `.dmg` from [Releases](https://github.com/pawan0912/yantra/releases).

**Important:** macOS blocks apps that are not notarized with Apple. You **must** run this command before opening the DMG:

```bash
xattr -cr ~/Downloads/Yantra_*.dmg
```

Then open the DMG and drag Yantra to Applications.

### Development

```bash
bun install
bun run tauri dev
```

### Build

```bash
bun run tauri build
```

The DMG is output to `src-tauri/target/release/bundle/dmg/`.

### Tests

```bash
bun test
```

## Tech Stack

- **Tauri v2** — native macOS app shell
- **React 19** + **TypeScript** (strict mode)
- **React Compiler** — automatic memoization
- **Tailwind CSS v4** — utility-first styling
- **Jotai** — atomic state management
- **Lucide React** — tree-shaken SVG icons
- **Reqwest** (Rust) — HTTP client for API Playground
- **Bun** — package manager and test runner

## Architecture

```
src/
├── components/
│   ├── layout/    # AppShell, ToolPane, CommandPalette, CopyButton
│   └── ui/        # Button, Textarea, SegmentedControl, PaneHeader, Kbd, Card
├── tools/
│   ├── types.ts       # ToolPlugin interface
│   ├── registry.ts    # All tool registrations + categories
│   └── <tool>/
│       ├── Tool.tsx       # React component
│       └── tool.utils.ts  # Pure transform functions (tested independently)
├── store/
│   ├── atoms.ts       # Jotai atoms (per-tool state, app config)
│   └── theme.ts       # Theme persistence
├── hooks/             # useClipboard, useTheme
└── App.tsx
```

### Adding a New Tool

1. Create `src/tools/<tool-name>/` with component + utils
2. Implement the `ToolPlugin` interface
3. Add one entry to `src/tools/registry.ts`

No changes to App, AppShell, or any other file needed.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ K` | Command palette |
| `⌘ ,` | Settings |
| `⌘ Enter` | Send request (API Playground) |

## License

[MIT](LICENSE)
