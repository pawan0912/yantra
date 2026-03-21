# Yantra — macOS Menu Bar Dev Toolbox

## Project Overview

A macOS desktop app called **Yantra** — a focused dev toolbox that lives in the menu bar. Designed for a frontend developer working with React Native/Expo, TypeScript, Zod, NativeWind, and i18next, but useful for the whole mixed dev team (mobile, web, backend). Accessible via a global hotkey, it auto-loads whatever is in the clipboard so you can paste and transform without breaking flow.

No backend. No accounts. Everything runs locally.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Tauri v2 | Small binary (~8MB), native macOS APIs, cross-platform later |
| Frontend | React 18 + TypeScript (strict) | Familiar, fast to build |
| Styling | Tailwind CSS v3 | Consistent, utility-first |
| Transforms | Vanilla JS / Web APIs | Pure string transforms, no heavy deps |
| Rust (minimal) | Tauri core only | Menu bar, global hotkey, clipboard, window management |

### Scaffold Command

```bash
npm create tauri-app@latest yantra -- --template react-ts
```

### Key Tauri Plugins (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "macos-private-api"] }
tauri-plugin-clipboard-manager = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-positioner = { version = "2", features = ["tray-icon"] }
```

### Frontend Dependencies (npm)

```json
{
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-clipboard-manager": "^2",
  "@tauri-apps/plugin-global-shortcut": "^2",
  "react": "^18",
  "react-dom": "^18",
  "tailwindcss": "^3"
}
```

Phase 2/3 only (install when needed):
- `curlconverter` — cURL parsing (MIT)
- `@faker-js/faker` — mock data generation (MIT)

### Plugin Permissions (src-tauri/capabilities/default.json)

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

---

## Core UX Principles

1. **Global hotkey** `Ctrl+Shift+Space` — shows/hides the window from anywhere
2. **Auto-paste on open** — reads clipboard on window focus, pre-fills the active tool's input
3. **Split pane layout** — input on left, output on right, every tool follows this pattern
4. **Copy output button** — always present, copies transformed result to clipboard
5. **Keyboard shortcuts** — `Cmd+1` through `Cmd+9` to switch between tools
6. **`Cmd+K` command palette** — fuzzy search tools by name/tags
7. **Menu bar tray icon** — always accessible, shows active tool name
8. **Dark mode** — follows macOS system setting via `prefers-color-scheme`
9. **Clipboard history** — last 10 items, cycle through recent pastes

---

## Folder Structure

```
yantra/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # sidebar tool list + main content area
│   │   │   ├── ToolPane.tsx         # input / output split pane
│   │   │   ├── CopyButton.tsx       # reusable copy-to-clipboard with feedback
│   │   │   └── CommandPalette.tsx   # Cmd+K fuzzy search overlay
│   │   └── ui/                      # shared primitives (Badge, MetaRow, Toggle, etc.)
│   ├── tools/
│   │   ├── registry.ts             # tool metadata: name, icon, shortcut, component
│   │   ├── json/
│   │   │   ├── JsonFormatter.tsx
│   │   │   └── json.utils.ts
│   │   ├── jwt/
│   │   │   ├── JwtDecoder.tsx
│   │   │   └── jwt.utils.ts
│   │   ├── base64/
│   │   │   ├── Base64Tool.tsx
│   │   │   └── base64.utils.ts
│   │   ├── url/
│   │   │   ├── UrlParser.tsx
│   │   │   └── url.utils.ts
│   │   ├── timestamp/
│   │   │   ├── TimestampConverter.tsx
│   │   │   └── timestamp.utils.ts
│   │   ├── regex/
│   │   │   ├── RegexTester.tsx
│   │   │   └── regex.utils.ts
│   │   ├── curl/
│   │   │   ├── CurlConverter.tsx
│   │   │   └── curl.utils.ts
│   │   ├── color/
│   │   │   ├── ColorConverter.tsx
│   │   │   └── color.utils.ts
│   │   ├── css-units/
│   │   │   ├── CssUnitConverter.tsx
│   │   │   └── css-units.utils.ts
│   │   ├── json-to-types/
│   │   │   ├── JsonToTypes.tsx
│   │   │   └── json-to-types.utils.ts
│   │   ├── diff/
│   │   │   ├── DiffViewer.tsx
│   │   │   └── diff.utils.ts
│   │   ├── i18n-lookup/
│   │   │   ├── I18nLookup.tsx
│   │   │   └── i18n-lookup.utils.ts
│   │   ├── tw-sorter/
│   │   │   ├── TwSorter.tsx
│   │   │   └── tw-sorter.utils.ts
│   │   └── mock-data/
│   │       ├── MockDataGenerator.tsx
│   │       └── mock-data.utils.ts
│   ├── store/
│   │   └── clipboard.ts            # auto-paste logic + clipboard history (last 10)
│   ├── hooks/
│   │   └── useClipboard.ts         # hook wrapping clipboard store
│   ├── lib/
│   │   └── utils.ts                # cn() helper, common utilities
│   ├── App.tsx                      # reads registry, renders active tool, keyboard shortcuts
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   └── main.rs                  # tray icon, hotkey, window mgmt, clipboard bridge
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

---

## Tool Registry Pattern

Every tool exports metadata. `tools/registry.ts` collects them:

```ts
type ToolMeta = {
  id: string;
  name: string;
  icon: string;
  shortcut: string;       // e.g. "1" for Cmd+1
  component: React.LazyComponent<React.ComponentType>;
  description: string;    // shown in Cmd+K palette
  tags: string[];         // for fuzzy matching
};
```

`App.tsx` reads the registry array to render the sidebar and route to the active tool. Adding a new tool means: create the tool directory, add an entry to the registry. No changes to App.tsx needed.

---

## Rust Backend (src-tauri/main.rs)

Minimal Rust — only system-level concerns. Everything else is in the React frontend.

### Setup Pattern (Tauri v2)

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

            // Build tray icon
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_hide, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "show_hide" => { /* toggle window */ }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### tauri.conf.json — Window Config

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

---

## Implementation Phases

### Phase 1 — App Shell + First 3 Tools (Day 1)

**Goal:** Working menu bar app with hotkey, clipboard, and 3 usable tools.

#### Step 1: Scaffold + Configure

1. Run scaffold: `npm create tauri-app@latest yantra -- --template react-ts`
2. Install and configure Tailwind CSS + PostCSS
3. Add Tauri plugins to `Cargo.toml` (see Tech Stack section above)
4. Install JS plugin packages:
   ```bash
   npm install @tauri-apps/plugin-clipboard-manager @tauri-apps/plugin-global-shortcut
   ```
5. Configure `tauri.conf.json` window settings (see above)
6. Add plugin permissions to `src-tauri/capabilities/default.json` (see above)
7. Verify: `npm run tauri dev` launches and shows a window

#### Step 2: Rust Backend

1. Implement `main.rs` with:
   - Tray icon with Show/Hide + Quit menu items
   - Global shortcut `Ctrl+Shift+Space` toggling window visibility
   - Window positioner (near tray icon)
   - Left-click on tray icon toggles window
2. **Verify:** hotkey toggles window, tray icon visible in menu bar, menu works

#### Step 3: App Shell (React)

1. **`AppShell.tsx`** — vertical sidebar listing tools (read from registry) + main content area
2. **`ToolPane.tsx`** — split pane component (input left, output right). Props: `input`, `output`, `actions` (buttons like Format/Minify). Use CSS Grid or flexbox, not a heavy splitter library.
3. **`CopyButton.tsx`** — copies text to clipboard via `@tauri-apps/plugin-clipboard-manager`, shows checkmark for 2s after copy
4. **`CommandPalette.tsx`** — `Cmd+K` overlay, fuzzy matches tool names/tags, arrow keys to navigate, Enter to select
5. **`store/clipboard.ts`** — on window focus event (listen via Tauri), read clipboard text and store it. Maintain array of last 10 clipboard entries.
6. **`tools/registry.ts`** — array of `ToolMeta` objects, lazy-import each tool component
7. **`App.tsx`** — renders `AppShell`, manages active tool state, handles `Cmd+1-9` shortcuts
8. **Dark mode:** Tailwind `darkMode: 'media'` in config, use `dark:` variants throughout
9. **Verify:** can switch between placeholder tools, Cmd+K works, clipboard auto-fills

#### Step 4: JSON Formatter (pattern-establishing tool)

- **`json.utils.ts`:**
  - `formatJson(input: string, indent?: number): string` — pretty print
  - `minifyJson(input: string): string` — compact
  - `validateJson(input: string): { valid: boolean; error?: string }` — check syntax
  - `getJsonMeta(input: string): { keyCount: number; maxDepth: number; arrayLengths: Record<string, number> }` — metadata
- **`JsonFormatter.tsx`:**
  - Uses `ToolPane` with input textarea (left) and output display (right)
  - Action buttons: Format, Minify, Validate
  - Output: syntax-highlighted JSON (use regex-based coloring — strings green, numbers blue, keys bold, etc.)
  - Meta bar below output: "Valid · 6 keys · depth 3"
  - Copy button on output pane
- **Verify:** paste JSON, click Format, see pretty output. Copy works.

#### Step 5: JWT Decoder

- **`jwt.utils.ts`:**
  - `decodeJwt(token: string): { header: object; payload: object; signature: string }` — split by `.`, base64url decode, JSON.parse
  - `getExpiry(payload: object): { expiresAt: Date | null; isExpired: boolean; timeRemaining: string }` — compute from `exp` claim
  - `getAlgorithm(header: object): string` — extract `alg` field
- **`JwtDecoder.tsx`:**
  - Input: single textarea for token
  - Output: tabbed view — Header JSON / Payload JSON / Info
  - Info tab: algorithm badge, expiry countdown ("expires in 2h 15m" or "expired 3 days ago"), issued at, signature status ("cannot verify without secret")
- **Verify:** paste a JWT, see decoded header and payload, expiry info

#### Step 6: Base64 Encode / Decode

- **`base64.utils.ts`:**
  - `encode(input: string, urlSafe?: boolean): string`
  - `decode(input: string): string`
  - `isBase64Image(input: string): { isImage: boolean; mimeType?: string }`
- **`Base64Tool.tsx`:**
  - Toggle: Encode / Decode mode
  - Toggle: Standard (`+/`) / URL-safe (`-_`) variant
  - If decoded output is a valid image data URI, show image preview below output
  - Auto-detect mode: if input looks like base64, default to Decode
- **Verify:** encode text, decode it back, paste a base64 image and see preview

---

### Phase 2 — Daily Driver Tools (Day 2)

**Goal:** Complete the most frequently used tools for daily frontend work.

#### Step 7: URL Encoder / Parser

- Parse using `new URL()` and `URLSearchParams`
- Display: protocol, host, pathname, each query param as its own editable row
- Edit individual params inline → reconstruct URL live
- Deep link support: handle `myapp://screen/detail?id=123` (custom schemes)
- Encode/decode toggle for the full URL string
- **Verify:** paste a complex URL with query params, edit a param, see URL update

#### Step 8: Timestamp Converter

- Input: auto-detect format (Unix seconds, Unix ms, ISO 8601, human-readable)
- Output: all formats side by side — Unix (s), Unix (ms), ISO 8601, relative ("3 hours ago")
- Show UTC and local timezone in parallel columns
- "Now" button: inserts current timestamp
- Smart paste: if input contains a timestamp within a larger string (log line), auto-extract it using regex for common log formats
- **Verify:** paste `1711234567`, see all formats. Paste a log line, see timestamp extracted.

#### Step 9: cURL → Code Converter

- Parse cURL command: method, URL, headers, body, auth flags, query params
- Output format selector (tabs):
  - **fetch()** — native browser fetch with proper options
  - **axios** — axios.get/post/etc with config object
  - **React Query hook** — `useQuery`/`useMutation` skeleton with TypeScript types inferred from the URL/body
- Use `curlconverter` (MIT) for parsing, custom output templates for React Query format
- Install: `npm install curlconverter`
- **Verify:** paste a cURL with headers and JSON body, see all 3 output formats

#### Step 10: Color Converter

- Input: paste hex, rgb(), hsl(), or oklch() — auto-detect format
- Output: all formats simultaneously
- Live color swatch preview (large rectangle)
- Copy-as options:
  - CSS custom property: `--color-brand: #1D9E75`
  - Tailwind arbitrary: `text-[#1D9E75]`
  - React Native StyleSheet: `color: '#1D9E75'`
- Contrast ratio checker: input a background color, show ratio + WCAG AA/AAA pass/fail badges
- **Verify:** paste `#1D9E75`, see rgb/hsl/oklch, see swatch, check contrast against white

---

### Phase 3 — Polish Week (Frontend Power Tools)

**Goal:** Add the tools that make Yantra uniquely useful for this team's stack.

#### Step 11: Regex Tester

- Pattern input with flag toggles: `g`, `i`, `m`, `s`, `u`
- Test string area with live match highlighting (colored spans)
- Named capture groups shown in a structured table
- Multiple test strings (add/remove rows)
- Preset dropdown: common patterns (email, UUID v4, semver, ISO date, URL)
- Match count and group info in meta bar

#### Step 12: CSS Unit Converter

- Input: number + unit (e.g., "16px")
- Output: equivalent in px, rem, em, vw, vh
- Settings: base font size (default 16px), viewport width/height
- Bidirectional: change any output to recompute others
- Quick reference table for common values

#### Step 13: JSON → TypeScript / Zod

- Input: paste a JSON object or array
- Output tabs:
  - **TypeScript interface** — nested types, arrays typed from first element, optional fields for null values
  - **Zod schema** — `z.object()`, `z.string()`, `z.number()`, `z.array()`, `z.nullable()`
  - **Zod with transforms** — adds `.transform()` stubs for ISO date strings, nullable patterns
- Settings: root type name (default "Root"), export style (type vs interface)
- Handle edge cases: empty arrays, mixed-type arrays, deeply nested objects

#### Step 14: Diff Viewer

- Two input panes (or paste-two-blobs mode)
- Output: line-by-line diff with added (green) / removed (red) / changed (yellow) highlighting
- Toggle: unified vs split view
- Auto-detect content type: if both inputs are valid JSON, auto-format before diffing
- Works well for: `.env` files, config files, API response comparison
- Line numbers on both sides

#### Step 15: i18n Key Lookup

- Setup: select/drag-drop a `locales/` directory to index all JSON locale files
- Mode 1: paste a translation key (e.g., `common.buttons.submit`) → show value in all languages side by side
- Mode 2: paste user-facing text (e.g., "Submit") → reverse-search which key(s) contain it
- Persist indexed directory path in localStorage so it survives app restart
- Search is instant (in-memory index after initial load)

#### Step 16: Tailwind / NativeWind Class Sorter

- Input: paste a `className` string
- Output: classes sorted in canonical Tailwind order (layout → sizing → spacing → typography → visual → interactive)
- Warnings: flag classes that don't work in React Native / NativeWind (e.g., `hover:`, certain pseudo-classes)
- Conversion mode: Tailwind class → equivalent React Native StyleSheet property/value pairs
- Useful during StyleSheet ↔ NativeWind migration

#### Step 17: Mock Data Generator

- Input: paste a JSON example object or JSON schema
- Settings: number of rows (1–100), output format (JSON array or CSV)
- Field type inference: string → name/email/lorem, number → random range, boolean → random, date → recent dates, uuid → v4
- Install: `npm install @faker-js/faker`
- Output: generated data array, copy-ready

---

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

---

## Distribution (when ready)

- **Local:** `npm run tauri build` → `.dmg` installer
- **Team sharing:** notarize (requires Apple Developer account) or `spctl --add` for internal bypass
- **Future:** Homebrew tap for easy team installs

---

## Out of Scope

- Windows / Linux builds (Tauri supports it, don't configure yet)
- Cloud sync or shared snippet library
- Any network requests or external APIs (all transforms are local)
- Authentication / accounts
- Backend server
