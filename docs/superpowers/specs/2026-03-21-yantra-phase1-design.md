# Yantra Phase 1 — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** App shell + first 3 tools (JSON Formatter, JWT Decoder, Base64 Tool)

---

## 1. Overview

Yantra is a macOS menu bar dev toolbox built with Tauri v2. It provides a suite of local-only string/data transform tools accessible via a global hotkey. Phase 1 delivers the foundational app shell and three pattern-establishing tools.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Tauri v2 (latest stable) | ~8MB binary, native macOS APIs |
| Frontend | React 19 + TypeScript (strict mode) | Intentional choice — verified compatible with Tauri v2 |
| Styling | Tailwind CSS v4 (dark mode via `prefers-color-scheme` by default) | |
| Package Manager | Bun | Intentional choice over npm for speed |
| Transforms | Pure JS/TS functions, Web APIs | No heavy deps |
| Rust | Minimal — tray, hotkey, clipboard bridge, window mgmt | |

### 2.1 Scaffold Command

```bash
bun create tauri-app yantra -- --template react-ts
```

### 2.2 Cargo.toml Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "macos-private-api"] }
tauri-plugin-clipboard-manager = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-positioner = { version = "2", features = ["tray-icon"] }
```

Note: `macos-private-api` feature is required for transparent window support on macOS.

### 2.3 Frontend Dependencies

```json
{
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-clipboard-manager": "^2",
  "@tauri-apps/plugin-global-shortcut": "^2",
  "react": "^19",
  "react-dom": "^19",
  "tailwindcss": "^3"
}
```

### 2.4 Plugin Permissions (src-tauri/capabilities/default.json)

```json
{
  "permissions": [
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

## 3. Architecture

### 3.1 Rust Backend (src-tauri/main.rs)

Responsibilities (nothing else):
- **Tray icon** — menu bar icon with Show/Hide + Quit menu items
- **Global hotkey** — `Ctrl+Shift+Space` toggles window visibility
- **Window positioning** — positions window near tray icon via `tauri-plugin-positioner`
- **Left-click tray** — toggles window visibility

Implementation pattern:
```rust
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::menu::{Menu, MenuItem};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    // Toggle main window visibility:
                    // if visible → hide, if hidden → show + position near tray + focus
                })
                .build(),
        )
        .setup(|app| {
            // Register Ctrl+Shift+Space
            app.global_shortcut().register("Ctrl+Shift+Space")?;

            // Build tray icon with Show/Hide + Quit menu
            // Left-click on tray toggles window
            // Use tauri_plugin_positioner::on_tray_event for positioning

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3.2 Window Configuration (tauri.conf.json)

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Yantra",
        "width": 900,
        "height": 600,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": false,
        "resizable": true
      }
    ]
  }
}
```

### 3.3 React Frontend

All tool logic, UI, and clipboard management lives in the frontend. No Rust commands for transforms.

State management: plain React state + context. No external state library for Phase 1.

### 3.4 Tool Registry Pattern

Each tool is a self-contained directory under `src/tools/<tool-name>/`:
- `ToolName.tsx` — React component using `ToolPane`
- `tool-name.utils.ts` — pure transform functions, independently testable

`tools/registry.ts` exports an array of `ToolMeta` objects:
```ts
type ToolMeta = {
  id: string;
  name: string;
  icon: string;
  shortcut: string;       // e.g. "1" for Cmd+1
  component: React.LazyExoticComponent<React.ComponentType>;
  description: string;
  tags: string[];
};
```

Adding a new tool = create directory + add registry entry. No changes to App.tsx.

## 4. Performance Strategy

- **Lazy loading** — `React.lazy` + `Suspense` for every tool component
- **Pure utils** — transform functions are plain TS, no React overhead
- **Smart debounce** — per-tool: 0ms for trivial transforms (base64), ~150ms for heavier ones (large JSON formatting)
- **Minimal deps** — Web APIs over libraries for all transforms
- **Thin Rust** — no unnecessary IPC roundtrips; clipboard is read via JS plugin API
- **Tailwind purge** — production builds strip unused CSS
- **CSS animations** — no JS-driven animations
- **Monospace font** — `font-mono` Tailwind class (system monospace stack) for all code/data display

## 5. App Shell Components

### 5.1 AppShell.tsx
- Vertical sidebar listing tools (read from registry)
- Main content area renders active tool via Suspense
- Active tool highlighted in sidebar
- Sidebar shows tool icon + name

### 5.2 ToolPane.tsx
- Split-pane layout: input (left), output (right)
- CSS Grid — no heavy splitter library

```ts
type ToolPaneProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  outputValue: string;
  outputElement?: React.ReactNode;  // for custom rendering (syntax highlighted JSON, tabs)
  actions: Array<{ label: string; onClick: () => void; active?: boolean }>;
  meta?: string;                    // meta bar text, e.g. "Valid · 6 keys · depth 3"
  error?: string;                   // error message shown in red below output
};
```

### 5.3 CopyButton.tsx
- Copies text to clipboard via `@tauri-apps/plugin-clipboard-manager`
- Shows checkmark icon for 2s after successful copy
- Reusable across all tools

### 5.4 CommandPalette.tsx
- `Cmd+K` overlay
- Fuzzy matches tool names and tags from registry
- Arrow keys to navigate, Enter to select, Escape to close
- Lightweight — no library, simple filter + keyboard handler

### 5.5 Clipboard Store (store/clipboard.ts)
- On window focus event (Tauri window focus listener via `@tauri-apps/api`), read clipboard text
- **Auto-paste behavior:** fills input only if input is empty or unchanged since last auto-paste. Never overwrites user-typed content.
- Store current clipboard content for auto-paste
- Clipboard history (last 10 items) — stored in memory, no UI to access in Phase 1 (deferred to Phase 1.5)
- Expose via `useClipboard` hook

### 5.6 Shared UI Primitives (src/components/ui/)

Phase 1 requires:
- **Toggle** — used in Base64 (encode/decode, standard/url-safe)
- **Badge** — used in JWT Info tab (algorithm badge, expired/valid badges)
- **TabBar** — used in JWT Decoder (Header/Payload/Info tabs)

### 5.7 lib/utils.ts

- `cn()` helper — merges Tailwind class strings (simple conditional join, no clsx dependency)
- Common shared utilities

## 6. Phase 1 Tools

### 6.1 JSON Formatter

**Utils (`json.utils.ts`):**
- `formatJson(input: string, indent?: number): string` — pretty print
- `minifyJson(input: string): string` — compact single line
- `validateJson(input: string): { valid: boolean; error?: string }` — syntax check
- `getJsonMeta(input: string): { keyCount: number; maxDepth: number; arrayLengths: Record<string, number> }` — metadata

**Component (`JsonFormatter.tsx`):**
- Input textarea (left pane) — `font-mono`
- Output: `<pre>` element with `<span>`-wrapped tokens for syntax highlighting (strings green, numbers blue, keys bold, booleans orange, null gray)
- Action buttons: Format, Minify
- Meta bar below output: "Valid · 6 keys · depth 3" or error message in red
- CopyButton on output pane
- Debounce: 150ms for live validation/meta updates

**Verify:** paste JSON, click Format, see pretty output. Copy works. Invalid JSON shows error.

### 6.2 JWT Decoder

**Utils (`jwt.utils.ts`):**
- `decodeJwt(token: string): { header: object; payload: object; signature: string }` — split by `.`, base64url decode, JSON.parse
- `getExpiry(payload: object): { expiresAt: Date | null; isExpired: boolean; timeRemaining: string }` — from `exp` claim
- `getAlgorithm(header: object): string` — extract `alg`

**Component (`JwtDecoder.tsx`):**
- Input: single textarea for token
- Output: tabbed view using TabBar — Header / Payload / Info
- Header and Payload tabs: syntax-highlighted JSON (reuse highlighting from JSON Formatter)
- Info tab: algorithm badge, expiry countdown ("expires in 2h 15m" or "expired 3 days ago"), issued at
- Signature note: "cannot verify without secret"
- No debounce — decoding is instant

**Verify:** paste a JWT, see decoded header and payload, expiry info. Invalid token shows error.

### 6.3 Base64 Encode/Decode

**Utils (`base64.utils.ts`):**
- `encode(input: string, urlSafe?: boolean): string`
- `decode(input: string): string`
- `isBase64Image(input: string): { isImage: boolean; mimeType?: string }` — checks for `data:image/*;base64,` prefix. Does not detect raw base64 image bytes in Phase 1.

**Component (`Base64Tool.tsx`):**
- Toggle: Encode / Decode mode (using Toggle component)
- Toggle: Standard (`+/`) / URL-safe (`-_`) variant
- Auto-detect: if input starts with base64 characters and has no spaces/newlines, default to Decode
- If decoded output is a valid data URI image, show `<img>` preview below output
- No debounce — base64 encode/decode is instant

**Verify:** encode text, decode it back. Paste a base64 data URI image, see preview.

## 7. Error Handling

All tools display errors inline:
- Invalid input → error message shown in red below the output pane (via `ToolPane.error` prop)
- Errors are non-blocking — the user can keep editing
- No modal dialogs or toast notifications for validation errors

## 8. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Space` | Global — toggle window visibility |
| `Cmd+K` | Open command palette |
| `Cmd+1` through `Cmd+9` | Switch to tool by position |
| `Escape` | Close command palette |

## 9. Dark Mode

- Tailwind `darkMode: 'media'` — follows macOS system preference
- All components use `dark:` variants
- No manual toggle (system preference only)

## 10. Folder Structure

```
yantra/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── ToolPane.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   └── CommandPalette.tsx
│   │   └── ui/
│   │       ├── Toggle.tsx
│   │       ├── Badge.tsx
│   │       └── TabBar.tsx
│   ├── tools/
│   │   ├── registry.ts
│   │   ├── json/
│   │   │   ├── JsonFormatter.tsx
│   │   │   └── json.utils.ts
│   │   ├── jwt/
│   │   │   ├── JwtDecoder.tsx
│   │   │   └── jwt.utils.ts
│   │   └── base64/
│   │       ├── Base64Tool.tsx
│   │       └── base64.utils.ts
│   ├── store/
│   │   └── clipboard.ts
│   ├── hooks/
│   │   └── useClipboard.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   └── icons/
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

## 11. Coding Conventions

- TypeScript strict mode
- Named exports only — no default exports
- kebab-case for files/directories
- PascalCase for component names
- Transform logic in `.utils.ts` — independently testable
- No heavy dependencies — Web APIs first
- 2+ function params → named destructured arguments
- Union types over enums, `as const` for constant maps
- Explicit return types on all functions
- Components under 100 lines — extract when larger

## 12. Acceptance Criteria

### App Shell
- [ ] `bun run tauri dev` launches, tray icon visible in menu bar
- [ ] `Ctrl+Shift+Space` toggles window visibility from any app
- [ ] Left-click tray icon toggles window
- [ ] Tray menu: Show/Hide and Quit work
- [ ] Sidebar lists all 3 tools, clicking switches active tool
- [ ] `Cmd+K` opens command palette, fuzzy search works, Enter selects
- [ ] `Cmd+1/2/3` switch tools
- [ ] Clipboard content auto-fills input on window focus (when input is empty)
- [ ] Dark mode follows system preference

### JSON Formatter
- [ ] Paste JSON → click Format → see pretty-printed, syntax-highlighted output
- [ ] Minify produces compact single-line output
- [ ] Invalid JSON shows error message in red
- [ ] Meta bar shows key count and depth
- [ ] Copy button copies output to clipboard

### JWT Decoder
- [ ] Paste JWT → see decoded Header and Payload as syntax-highlighted JSON
- [ ] Info tab shows algorithm badge, expiry countdown
- [ ] Invalid token shows error

### Base64 Tool
- [ ] Encode text → copy → decode → get original text
- [ ] URL-safe toggle changes encoding variant
- [ ] Auto-detects base64 input and switches to Decode mode
- [ ] Data URI image shows preview

## 13. Distribution

- `bun run tauri build` → `.dmg` installer (~8-15MB)
- Notarize with Apple Developer account for team sharing
- Or `spctl --add` for internal bypass

## 14. Out of Scope

- Windows/Linux builds
- Cloud sync, network requests, external APIs
- Authentication/accounts
- Backend server
- Phase 2/3 tools
- Clipboard history UI (stored but not accessible until Phase 1.5)
