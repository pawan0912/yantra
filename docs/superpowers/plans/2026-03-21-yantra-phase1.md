# Yantra Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working macOS menu bar dev toolbox with app shell, clipboard integration, and 3 tools (JSON Formatter, JWT Decoder, Base64 Tool).

**Architecture:** Tauri v2 Rust backend handles system-level concerns (tray icon, global hotkey, window management). React 19 frontend handles all UI and transform logic. Tools are lazy-loaded via a registry pattern. Pure utility functions are separated from React components for testability.

**Tech Stack:** Tauri v2, React 19, TypeScript (strict), Tailwind CSS v4, Bun

**Spec:** `docs/superpowers/specs/2026-03-21-yantra-phase1-design.md`

---

## File Structure

```
yantra/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # sidebar + main content area
│   │   │   ├── ToolPane.tsx          # input/output split pane
│   │   │   ├── CopyButton.tsx        # copy-to-clipboard with feedback
│   │   │   └── CommandPalette.tsx     # Cmd+K fuzzy search overlay
│   │   └── ui/
│   │       ├── Toggle.tsx            # binary toggle switch
│   │       ├── Badge.tsx             # small status/info badge
│   │       └── TabBar.tsx            # horizontal tab switcher
│   ├── tools/
│   │   ├── registry.ts              # tool metadata array
│   │   ├── json/
│   │   │   ├── JsonFormatter.tsx     # JSON format/minify tool
│   │   │   └── json.utils.ts        # pure JSON transform functions
│   │   ├── jwt/
│   │   │   ├── JwtDecoder.tsx        # JWT decode/inspect tool
│   │   │   └── jwt.utils.ts         # pure JWT decode functions
│   │   └── base64/
│   │       ├── Base64Tool.tsx        # Base64 encode/decode tool
│   │       └── base64.utils.ts      # pure base64 functions
│   ├── store/
│   │   └── clipboard.ts             # clipboard auto-read + history
│   ├── hooks/
│   │   └── useClipboard.ts          # hook wrapping clipboard store
│   ├── lib/
│   │   └── utils.ts                 # cn() helper
│   ├── App.tsx                       # root: registry, routing, keyboard shortcuts
│   ├── App.css                       # Tailwind directives + global styles
│   └── main.tsx                      # React DOM entry point
├── src-tauri/
│   ├── src/
│   │   └── main.rs                   # tray icon, hotkey, window management
│   ├── Cargo.toml                    # Tauri + plugin dependencies
│   ├── tauri.conf.json               # window config, app metadata
│   └── capabilities/
│       └── default.json              # plugin permissions
├── index.html                        # Vite entry HTML
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── package.json
└── CLAUDE.md
```

---

## Task 0: Install Toolchain Prerequisites

**Files:** None (system-level installs)

- [ ] **Step 1: Install Bun**

```bash
curl -fsSL https://bun.sh/install | bash
```

After install, verify:
```bash
source ~/.zshrc
bun --version
```
Expected: version number like `1.x.x`

- [ ] **Step 2: Install Rust via rustup**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

After install, verify:
```bash
source "$HOME/.cargo/env"
rustc --version
cargo --version
```
Expected: `rustc 1.x.x` and `cargo 1.x.x`

- [ ] **Step 3: Install Tauri CLI**

```bash
cargo install tauri-cli --version "^2"
```

Verify:
```bash
cargo tauri --version
```
Expected: `tauri-cli 2.x.x`

- [ ] **Step 4: Verify Xcode Command Line Tools**

```bash
xcode-select -p
```
Expected: `/Library/Developer/CommandLineTools` or similar. If missing:
```bash
xcode-select --install
```

---

## Task 1: Scaffold Tauri + React Project

**Files:**
- Create: entire project scaffold in `/Users/pawanverma/Projects/yantra/`

- [ ] **Step 1: Scaffold the project**

Run from parent directory (the scaffold creates the project folder contents):
```bash
cd /Users/pawanverma/Projects
bunx create-tauri-app@latest yantra --template react-ts --manager bun --yes
```

Note: If `yantra/` already has files (like CLAUDE.md), the scaffolder may refuse. In that case, scaffold to a temp name and move contents:
```bash
bunx create-tauri-app@latest yantra-tmp --template react-ts --manager bun --yes
# Move scaffold contents into yantra/, preserving CLAUDE.md
cp -r yantra-tmp/* yantra/
cp -r yantra-tmp/.* yantra/ 2>/dev/null || true
rm -rf yantra-tmp
```

- [ ] **Step 2: Verify scaffold builds**

```bash
cd /Users/pawanverma/Projects/yantra
bun install
bun run tauri dev
```
Expected: A Tauri window opens showing the default React template. Close it with Cmd+Q.

- [ ] **Step 3: Initialize git repository**

```bash
cd /Users/pawanverma/Projects/yantra
git init
git add -A
git commit -m "chore: scaffold Tauri v2 + React + TypeScript project"
```

---

## Task 2: Configure Tauri Plugins & Permissions

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Add Tauri plugin dependencies to Cargo.toml**

In `src-tauri/Cargo.toml`, update the `[dependencies]` section. Keep existing deps and add/modify:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "macos-private-api"] }
tauri-plugin-clipboard-manager = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-positioner = { version = "2", features = ["tray-icon"] }
```

- [ ] **Step 2: Configure window settings in tauri.conf.json**

Update the window configuration in `src-tauri/tauri.conf.json`:

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

Also set the app identifier to something unique like `com.yantra.dev`.

- [ ] **Step 3: Add plugin permissions to capabilities/default.json**

Update `src-tauri/capabilities/default.json` to include:

```json
{
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

- [ ] **Step 4: Install frontend Tauri plugin packages**

```bash
bun add @tauri-apps/api @tauri-apps/plugin-clipboard-manager @tauri-apps/plugin-global-shortcut
```

- [ ] **Step 5: Verify everything compiles**

```bash
bun run tauri dev
```
Expected: Builds without errors. Window may not show (visible: false) — that's correct. Kill with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure Tauri plugins, permissions, and window settings"
```

---

## Task 3: Rust Backend — Tray Icon, Hotkey, Window Management

**Files:**
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Implement main.rs with tray icon and global hotkey**

Replace the contents of `src-tauri/src/main.rs` with:

```rust
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::menu::{Menu, MenuItem};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

fn toggle_window(window: &WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Register global hotkey
            app.global_shortcut().register("Ctrl+Shift+Space")?;

            // Build tray menu
            let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_hide, &quit])?;

            // Build tray icon
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "show_hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
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
                            toggle_window(&window);
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

- [ ] **Step 2: Verify tray icon and hotkey work**

```bash
bun run tauri dev
```

Test:
1. Tray icon appears in menu bar
2. Right-click tray icon → menu with "Show/Hide" and "Quit"
3. Click "Show/Hide" → window toggles
4. Left-click tray icon → window toggles
5. Press `Ctrl+Shift+Space` → window toggles from any app
6. Click "Quit" → app exits

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement tray icon, global hotkey, and window management"
```

---

## Task 4: Tailwind CSS Setup

**Files:**
- Modify: `package.json` (add tailwind deps)
- Modify: `vite.config.ts` (add tailwind plugin)
- Modify: `src/App.css` (tailwind directives)

Note: Tailwind v4 does not require `tailwind.config.js` or `postcss.config.js`. Dark mode uses `prefers-color-scheme` by default. The `dark:` variants work automatically.

- [ ] **Step 1: Install Tailwind CSS and PostCSS**

```bash
bun add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add Tailwind Vite plugin**

Update `vite.config.ts` to add the Tailwind plugin:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

- [ ] **Step 3: Add Tailwind import to CSS**

Replace contents of `src/App.css` (or the main CSS file) with:

```css
@import "tailwindcss";
```

Remove any default scaffold styles from other CSS files. Make sure `main.tsx` or `App.tsx` imports this CSS file.

- [ ] **Step 4: Verify Tailwind works**

Add a test class to any element in `App.tsx`:
```tsx
<div className="bg-blue-500 text-white p-4">Tailwind works</div>
```

Run `bun run tauri dev` and verify the blue background appears. Then remove the test element.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind CSS v4 with Vite plugin"
```

---

## Task 5: Shared Utilities and UI Primitives

**Files:**
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/Toggle.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/TabBar.tsx`

- [ ] **Step 1: Create cn() utility**

Create `src/lib/utils.ts`:

```ts
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

- [ ] **Step 2: Create Toggle component**

Create `src/components/ui/Toggle.tsx`:

```tsx
import { cn } from "../../lib/utils";

type ToggleOption = {
  label: string;
  value: string;
};

type ToggleProps = {
  options: [ToggleOption, ToggleOption];
  value: string;
  onChange: (value: string) => void;
};

export function Toggle({ options, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded transition-colors",
            value === option.value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create Badge component**

Create `src/components/ui/Badge.tsx`:

```tsx
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
} as const;

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
};

export function Badge({ children, variant = "default" }: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create TabBar component**

Create `src/components/ui/TabBar.tsx`:

```tsx
import { cn } from "../../lib/utils";

type TabBarProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps): React.ReactElement {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium border-b-2 transition-colors",
            activeTab === tab
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared utilities (cn) and UI primitives (Toggle, Badge, TabBar)"
```

---

## Task 6: CopyButton Component

**Files:**
- Create: `src/components/layout/CopyButton.tsx`

- [ ] **Step 1: Create CopyButton**

Create `src/components/layout/CopyButton.tsx`:

```tsx
import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for dev mode without Tauri runtime
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add CopyButton component with clipboard integration"
```

---

## Task 7: ToolPane Component

**Files:**
- Create: `src/components/layout/ToolPane.tsx`

- [ ] **Step 1: Create ToolPane**

Create `src/components/layout/ToolPane.tsx`:

```tsx
import { CopyButton } from "./CopyButton";

type ToolAction = {
  label: string;
  onClick: () => void;
  active?: boolean;
};

type ToolPaneProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  outputValue: string;
  outputElement?: React.ReactNode;
  actions: ToolAction[];
  meta?: string;
  error?: string;
};

export function ToolPane({
  inputValue,
  onInputChange,
  outputValue,
  outputElement,
  actions,
  meta,
  error,
}: ToolPaneProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              action.active
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {action.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton text={outputValue} />
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 min-h-0">
        {/* Input */}
        <div className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            Input
          </div>
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 p-3 bg-transparent text-sm font-mono text-gray-900 dark:text-gray-100
                       resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="Paste or type here..."
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            Output
          </div>
          <div className="flex-1 overflow-auto p-3">
            {outputElement ?? (
              <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {outputValue}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Meta / Error bar */}
      {(meta || error) && (
        <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 text-xs">
          {error ? (
            <span className="text-red-500 dark:text-red-400">{error}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{meta}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ToolPane split-pane layout component"
```

---

## Task 8: Clipboard Store & Hook

**Files:**
- Create: `src/store/clipboard.ts`
- Create: `src/hooks/useClipboard.ts`

- [ ] **Step 1: Create clipboard store**

Create `src/store/clipboard.ts`:

```ts
import { readText } from "@tauri-apps/plugin-clipboard-manager";

const MAX_HISTORY = 10;

let currentText = "";
let history: string[] = [];
let listeners: Array<() => void> = [];

function notify(): void {
  listeners.forEach((fn) => fn());
}

export async function readClipboard(): Promise<string> {
  try {
    const text = await readText();
    if (text && text !== currentText) {
      currentText = text;
      history = [text, ...history.filter((h) => h !== text)].slice(0, MAX_HISTORY);
      notify();
    }
    return currentText;
  } catch {
    // Fallback for dev mode
    try {
      const text = await navigator.clipboard.readText();
      if (text && text !== currentText) {
        currentText = text;
        history = [text, ...history.filter((h) => h !== text)].slice(0, MAX_HISTORY);
        notify();
      }
      return currentText;
    } catch {
      return currentText;
    }
  }
}

export function getCurrentText(): string {
  return currentText;
}

export function getHistory(): string[] {
  return history;
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
```

- [ ] **Step 2: Create useClipboard hook**

Create `src/hooks/useClipboard.ts`:

```ts
import { useEffect, useState, useSyncExternalStore } from "react";
import { getCurrentText, subscribe, readClipboard } from "../store/clipboard";

export function useClipboard(): { clipboardText: string; refresh: () => Promise<string> } {
  const clipboardText = useSyncExternalStore(subscribe, getCurrentText);

  // Read clipboard on mount (window focus is handled by App.tsx)
  useEffect(() => {
    readClipboard();
  }, []);

  return { clipboardText, refresh: readClipboard };
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add clipboard store and useClipboard hook"
```

---

## Task 9: Tool Registry

**Files:**
- Create: `src/tools/registry.ts`

- [ ] **Step 1: Create registry with 3 tool entries**

Create `src/tools/registry.ts`:

```ts
import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

export type ToolProps = {
  clipboardText: string;
};

export type ToolMeta = {
  id: string;
  name: string;
  icon: string;
  shortcut: string;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
  description: string;
  tags: string[];
};

export const tools: ToolMeta[] = [
  {
    id: "json",
    name: "JSON Formatter",
    icon: "{ }",
    shortcut: "1",
    component: lazy(() =>
      import("./json/JsonFormatter").then((m) => ({ default: m.JsonFormatter }))
    ),
    description: "Format, minify, and validate JSON",
    tags: ["json", "format", "minify", "validate", "pretty"],
  },
  {
    id: "jwt",
    name: "JWT Decoder",
    icon: "🔑",
    shortcut: "2",
    component: lazy(() =>
      import("./jwt/JwtDecoder").then((m) => ({ default: m.JwtDecoder }))
    ),
    description: "Decode and inspect JWT tokens",
    tags: ["jwt", "token", "decode", "auth", "bearer"],
  },
  {
    id: "base64",
    name: "Base64",
    icon: "Aa",
    shortcut: "3",
    component: lazy(() =>
      import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool }))
    ),
    description: "Encode and decode Base64 strings",
    tags: ["base64", "encode", "decode", "binary"],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add tool registry with JSON, JWT, and Base64 entries"
```

---

## Task 10: JSON Formatter — Utils

**Files:**
- Create: `src/tools/json/json.utils.ts`

- [ ] **Step 1: Implement JSON utility functions**

Create `src/tools/json/json.utils.ts`:

```ts
export function formatJson({ input, indent = 2 }: { input: string; indent?: number }): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson({ input }: { input: string }): string {
  return JSON.stringify(JSON.parse(input));
}

export function validateJson({ input }: { input: string }): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

type JsonMeta = {
  keyCount: number;
  maxDepth: number;
  arrayLengths: Record<string, number>;
};

export function getJsonMeta({ input }: { input: string }): JsonMeta {
  const parsed = JSON.parse(input);

  let keyCount = 0;
  let maxDepth = 0;
  const arrayLengths: Record<string, number> = {};

  function walk(value: unknown, depth: number, path: string): void {
    if (depth > maxDepth) maxDepth = depth;

    if (Array.isArray(value)) {
      arrayLengths[path || "root"] = value.length;
      value.forEach((item, i) => walk(item, depth + 1, `${path}[${i}]`));
    } else if (value !== null && typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      keyCount += keys.length;
      keys.forEach((key) =>
        walk((value as Record<string, unknown>)[key], depth + 1, path ? `${path}.${key}` : key)
      );
    }
  }

  walk(parsed, 0, "");
  return { keyCount, maxDepth, arrayLengths };
}

export function highlightJson({ json }: { json: string }): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(?:\\.|[^"\\])*")\s*:/g,
      '<span class="text-gray-900 dark:text-gray-100 font-semibold">$1</span>:'
    )
    .replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      ': <span class="text-green-600 dark:text-green-400">$1</span>'
    )
    .replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span class="text-blue-600 dark:text-blue-400">$1</span>'
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span class="text-orange-600 dark:text-orange-400">$1</span>'
    )
    .replace(
      /:\s*(null)/g,
      ': <span class="text-gray-400 dark:text-gray-500">$1</span>'
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add JSON utility functions (format, minify, validate, meta, highlight)"
```

---

## Task 11: JSON Formatter — Component

**Files:**
- Create: `src/tools/json/JsonFormatter.tsx`

- [ ] **Step 1: Implement JsonFormatter component**

Create `src/tools/json/JsonFormatter.tsx`:

```tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { formatJson, minifyJson, validateJson, getJsonMeta, highlightJson } from "./json.utils";
import type { ToolProps } from "../registry";

export function JsonFormatter({ clipboardText }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const hasUserTyped = useRef(false);

  // Auto-fill from clipboard when input is empty and user hasn't typed
  useEffect(() => {
    if (clipboardText && !hasUserTyped.current && !input) {
      setInput(clipboardText);
    }
  }, [clipboardText, input]);

  const handleInputChange = (value: string): void => {
    hasUserTyped.current = true;
    setInput(value);
  };
  const [output, setOutput] = useState("");

  const validation = useMemo(() => {
    if (!input.trim()) return null;
    return validateJson({ input });
  }, [input]);

  const meta = useMemo(() => {
    if (!input.trim() || !validation?.valid) return undefined;
    try {
      const m = getJsonMeta({ input });
      return `Valid · ${m.keyCount} keys · depth ${m.maxDepth}`;
    } catch {
      return undefined;
    }
  }, [input, validation]);

  const highlighted = useMemo(() => {
    if (!output) return null;
    return highlightJson({ json: output });
  }, [output]);

  const handleFormat = (): void => {
    try {
      setOutput(formatJson({ input }));
    } catch {
      setOutput("");
    }
  };

  const handleMinify = (): void => {
    try {
      setOutput(minifyJson({ input }));
    } catch {
      setOutput("");
    }
  };

  const error = input.trim() && validation && !validation.valid ? validation.error : undefined;

  return (
    <ToolPane
      inputValue={input}
      onInputChange={handleInputChange}
      outputValue={output}
      outputElement={
        highlighted ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : undefined
      }
      actions={[
        { label: "Format", onClick: handleFormat },
        { label: "Minify", onClick: handleMinify },
      ]}
      meta={meta}
      error={error}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add JsonFormatter component with format, minify, and syntax highlighting"
```

---

## Task 12: JWT Decoder — Utils

**Files:**
- Create: `src/tools/jwt/jwt.utils.ts`

- [ ] **Step 1: Implement JWT utility functions**

Create `src/tools/jwt/jwt.utils.ts`:

```ts
type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
};

export function decodeJwt({ token }: { token: string }): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts separated by dots");
  }

  const decodeBase64Url = (str: string): string => {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const final = pad ? padded + "=".repeat(4 - pad) : padded;
    return atob(final);
  };

  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));

  return { header, payload, signature: parts[2] };
}

type ExpiryInfo = {
  expiresAt: Date | null;
  isExpired: boolean;
  timeRemaining: string;
};

export function getExpiry({ payload }: { payload: Record<string, unknown> }): ExpiryInfo {
  const exp = payload.exp;
  if (typeof exp !== "number") {
    return { expiresAt: null, isExpired: false, timeRemaining: "No expiry set" };
  }

  const expiresAt = new Date(exp * 1000);
  const now = Date.now();
  const diff = expiresAt.getTime() - now;
  const isExpired = diff <= 0;

  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);

  let timeRemaining: string;
  if (days > 0) {
    timeRemaining = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeRemaining = `${hours}h ${minutes}m`;
  } else {
    timeRemaining = `${minutes}m`;
  }

  timeRemaining = isExpired ? `expired ${timeRemaining} ago` : `expires in ${timeRemaining}`;

  return { expiresAt, isExpired, timeRemaining };
}

export function getAlgorithm({ header }: { header: Record<string, unknown> }): string {
  return typeof header.alg === "string" ? header.alg : "unknown";
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add JWT utility functions (decode, expiry, algorithm)"
```

---

## Task 13: JWT Decoder — Component

**Files:**
- Create: `src/tools/jwt/JwtDecoder.tsx`

- [ ] **Step 1: Implement JwtDecoder component**

Create `src/tools/jwt/JwtDecoder.tsx`:

```tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { TabBar } from "../../components/ui/TabBar";
import { Badge } from "../../components/ui/Badge";
import { decodeJwt, getExpiry, getAlgorithm } from "./jwt.utils";
import { highlightJson } from "../json/json.utils";
import type { ToolProps } from "../registry";

const TABS = ["Header", "Payload", "Info"] as const;

export function JwtDecoder({ clipboardText }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const hasUserTyped = useRef(false);

  useEffect(() => {
    if (clipboardText && !hasUserTyped.current && !input) {
      setInput(clipboardText);
    }
  }, [clipboardText, input]);

  const handleInputChange = (value: string): void => {
    hasUserTyped.current = true;
    setInput(value);
  };
  const [activeTab, setActiveTab] = useState<string>("Header");

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return decodeJwt({ token: input });
    } catch {
      return null;
    }
  }, [input]);

  const error = input.trim() && !decoded ? "Invalid JWT token" : undefined;

  const outputText = useMemo(() => {
    if (!decoded) return "";
    if (activeTab === "Header") return JSON.stringify(decoded.header, null, 2);
    if (activeTab === "Payload") return JSON.stringify(decoded.payload, null, 2);
    return "";
  }, [decoded, activeTab]);

  const outputElement = useMemo(() => {
    if (!decoded) return undefined;

    const infoContent = (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Algorithm</span>
          <Badge variant="info">{getAlgorithm({ header: decoded.header })}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Expiry</span>
          {(() => {
            const expiry = getExpiry({ payload: decoded.payload });
            return <Badge variant={expiry.isExpired ? "error" : "success"}>{expiry.timeRemaining}</Badge>;
          })()}
        </div>
        {(() => {
          const expiry = getExpiry({ payload: decoded.payload });
          return expiry.expiresAt ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-20">Expires at</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {expiry.expiresAt.toISOString()}
              </span>
            </div>
          ) : null;
        })()}
        {typeof decoded.payload.iat === "number" && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 w-20">Issued at</span>
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
              {new Date((decoded.payload.iat as number) * 1000).toISOString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 w-20">Signature</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
            Cannot verify without secret
          </span>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        <TabBar tabs={[...TABS]} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto p-3">
          {activeTab === "Info" ? (
            infoContent
          ) : (
            <pre
              className="text-sm font-mono whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: highlightJson({ json: outputText }) }}
            />
          )}
        </div>
      </div>
    );
  }, [decoded, activeTab, outputText]);

  return (
    <ToolPane
      inputValue={input}
      onInputChange={handleInputChange}
      outputValue={outputText}
      outputElement={wrappedOutput}
      actions={[]}
      error={error}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add JwtDecoder component with header/payload/info tabs"
```

---

## Task 14: Base64 Tool — Utils

**Files:**
- Create: `src/tools/base64/base64.utils.ts`

- [ ] **Step 1: Implement Base64 utility functions**

Create `src/tools/base64/base64.utils.ts`:

```ts
export function encode({ input, urlSafe = false }: { input: string; urlSafe?: boolean }): string {
  const encoded = btoa(
    new TextEncoder()
      .encode(input)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
  );
  if (urlSafe) {
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return encoded;
}

export function decode({ input }: { input: string }): string {
  // Normalize URL-safe base64 to standard
  let normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  if (pad) {
    normalized += "=".repeat(4 - pad);
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function isBase64Image({ input }: { input: string }): {
  isImage: boolean;
  mimeType?: string;
} {
  const match = input.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  if (match) {
    return { isImage: true, mimeType: match[1] };
  }
  return { isImage: false };
}

export function looksLikeBase64({ input }: { input: string }): boolean {
  if (input.length < 4) return false;
  // Data URIs are definitely base64
  if (input.startsWith("data:")) return true;
  // Check if it looks like base64 (only valid chars, reasonable length)
  return /^[A-Za-z0-9+/\-_=\s]+$/.test(input) && input.length > 20;
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Base64 utility functions (encode, decode, image detection)"
```

---

## Task 15: Base64 Tool — Component

**Files:**
- Create: `src/tools/base64/Base64Tool.tsx`

- [ ] **Step 1: Implement Base64Tool component**

Create `src/tools/base64/Base64Tool.tsx`:

```tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { Toggle } from "../../components/ui/Toggle";
import { encode, decode, isBase64Image, looksLikeBase64 } from "./base64.utils";
import type { ToolProps } from "../registry";

type Mode = "encode" | "decode";
type Variant = "standard" | "urlsafe";

export function Base64Tool({ clipboardText }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const hasUserTyped = useRef(false);

  useEffect(() => {
    if (clipboardText && !hasUserTyped.current && !input) {
      setInput(clipboardText);
    }
  }, [clipboardText, input]);

  const handleInputChange = (value: string): void => {
    hasUserTyped.current = true;
    setInput(value);
  };
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Variant>("standard");
  const [userSetMode, setUserSetMode] = useState(false);

  // Auto-detect mode only when user hasn't manually toggled
  useEffect(() => {
    if (!userSetMode && input && looksLikeBase64({ input })) {
      setMode("decode");
    }
  }, [input, userSetMode]);

  const handleModeChange = (v: string): void => {
    setMode(v as Mode);
    setUserSetMode(true);
  };

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: undefined };
    try {
      if (mode === "encode") {
        return { output: encode({ input, urlSafe: variant === "urlsafe" }), error: undefined };
      }
      return { output: decode({ input }), error: undefined };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [input, mode, variant]);

  const imagePreview = useMemo(() => {
    if (mode !== "decode") return null;
    const check = isBase64Image({ input });
    if (check.isImage) return input;
    return null;
  }, [mode, input]);

  const outputElement = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Toggle
          options={[
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
          ]}
          value={mode}
          onChange={handleModeChange}
        />
        <Toggle
          options={[
            { label: "Standard", value: "standard" },
            { label: "URL-safe", value: "urlsafe" },
          ]}
          value={variant}
          onChange={(v) => setVariant(v as Variant)}
        />
      </div>
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
          {output}
        </pre>
        {imagePreview && (
          <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded p-2">
            <img
              src={imagePreview}
              alt="Decoded base64 image"
              className="max-w-full max-h-48 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolPane
      inputValue={input}
      onInputChange={handleInputChange}
      outputValue={output}
      outputElement={outputElement}
      actions={[]}
      error={error}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Base64Tool component with encode/decode and image preview"
```

---

## Task 16: CommandPalette Component

**Files:**
- Create: `src/components/layout/CommandPalette.tsx`

- [ ] **Step 1: Implement CommandPalette**

Create `src/components/layout/CommandPalette.tsx`:

```tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { tools, type ToolMeta } from "../../tools/registry";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
};

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return tools;
    return tools.filter(
      (tool) =>
        fuzzyMatch(query, tool.name) ||
        fuzzyMatch(query, tool.description) ||
        tool.tags.some((tag) => fuzzyMatch(query, tag))
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex].id);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div
        className="w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools..."
          className="w-full px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-gray-100
                     border-b border-gray-200 dark:border-gray-700 focus:outline-none
                     placeholder-gray-400 dark:placeholder-gray-600"
        />
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((tool, i) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelect(tool.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="w-6 text-center text-xs">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {tool.description}
                </div>
              </div>
              <kbd className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                ⌘{tool.shortcut}
              </kbd>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No tools found</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add CommandPalette component with fuzzy search"
```

---

## Task 17: AppShell Component

**Files:**
- Create: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Implement AppShell**

Create `src/components/layout/AppShell.tsx`:

```tsx
import { Suspense } from "react";
import { tools, type ToolMeta } from "../../tools/registry";
import { cn } from "../../lib/utils";

type AppShellProps = {
  activeToolId: string;
  onToolSelect: (toolId: string) => void;
  clipboardText: string;
};

export function AppShell({ activeToolId, onToolSelect, clipboardText }: AppShellProps): React.ReactElement {
  const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <nav className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="px-3 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
          Yantra
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
                tool.id === activeToolId
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <span className="w-5 text-center text-xs">{tool.icon}</span>
              <span className="truncate">{tool.name}</span>
              <kbd className="ml-auto text-[10px] text-gray-400 dark:text-gray-600">
                ⌘{tool.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Loading...
            </div>
          }
        >
          <ActiveComponent clipboardText={clipboardText} />
        </Suspense>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add AppShell with sidebar navigation and lazy-loaded tool rendering"
```

---

## Task 18: App.tsx — Root Component with Keyboard Shortcuts

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Implement App.tsx**

Replace `src/App.tsx` with:

```tsx
import { useState, useEffect, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { CommandPalette } from "./components/layout/CommandPalette";
import { tools } from "./tools/registry";
import { useClipboard } from "./hooks/useClipboard";
import "./App.css";

export function App(): React.ReactElement {
  const [activeToolId, setActiveToolId] = useState(tools[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { clipboardText, refresh } = useClipboard();

  // Read clipboard on window focus
  useEffect(() => {
    const handleFocus = (): void => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      // Cmd+K — command palette
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      // Cmd+1-9 — switch tools
      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const tool = tools.find((t) => t.shortcut === e.key);
        if (tool) setActiveToolId(tool.id);
        return;
      }

      // Escape — close palette
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    },
    [paletteOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <AppShell activeToolId={activeToolId} onToolSelect={setActiveToolId} clipboardText={clipboardText} />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={setActiveToolId}
      />
    </>
  );
}
```

- [ ] **Step 2: Update main.tsx**

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Update App.css**

Replace `src/App.css` with:

```css
@import "tailwindcss";
```

Remove any other CSS files that were part of the scaffold (like `index.css`) and remove their imports from `main.tsx` if present.

- [ ] **Step 4: Verify the full app works**

```bash
bun run tauri dev
```

Test:
1. Tray icon in menu bar, hotkey toggles window
2. Sidebar shows 3 tools, clicking switches between them
3. Cmd+K opens command palette, fuzzy search works
4. Cmd+1/2/3 switch tools
5. JSON Formatter: paste JSON → Format → see highlighted output
6. JWT Decoder: paste a JWT → see decoded tabs
7. Base64: type text → see encoded output, toggle decode
8. Copy button works on all tools
9. Dark mode: toggle macOS dark mode in System Settings → app follows

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App with keyboard shortcuts, clipboard integration, and all Phase 1 tools"
```

---

## Task 19: Final Cleanup and Polish

**Files:**
- Clean up: remove any scaffold files not needed
- Update: `index.html` if needed

- [ ] **Step 1: Clean up scaffold remnants**

Remove unused scaffold files:
- Any default `assets/` images from the React template (logo, etc.)
- Any default CSS not being used
- Any default component files from the scaffold

Update `index.html` title:
```html
<title>Yantra</title>
```

- [ ] **Step 2: Verify clean build**

```bash
bun run tauri build
```

Expected: Build succeeds, produces `.dmg` in `src-tauri/target/release/bundle/dmg/`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: clean up scaffold remnants, finalize Phase 1"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 0 | Install toolchain (Bun, Rust, Tauri CLI) | System-level |
| 1 | Scaffold project | Full scaffold |
| 2 | Configure Tauri plugins & permissions | Cargo.toml, tauri.conf.json, default.json |
| 3 | Rust backend (tray, hotkey, window) | main.rs |
| 4 | Tailwind CSS setup | vite.config.ts, App.css |
| 5 | Shared utilities & UI primitives | utils.ts, Toggle, Badge, TabBar |
| 6 | CopyButton | CopyButton.tsx |
| 7 | ToolPane | ToolPane.tsx |
| 8 | Clipboard store & hook | clipboard.ts, useClipboard.ts |
| 9 | Tool registry | registry.ts |
| 10 | JSON Formatter utils | json.utils.ts |
| 11 | JSON Formatter component | JsonFormatter.tsx |
| 12 | JWT Decoder utils | jwt.utils.ts |
| 13 | JWT Decoder component | JwtDecoder.tsx |
| 14 | Base64 utils | base64.utils.ts |
| 15 | Base64 component | Base64Tool.tsx |
| 16 | CommandPalette | CommandPalette.tsx |
| 17 | AppShell | AppShell.tsx |
| 18 | App.tsx root with shortcuts | App.tsx, main.tsx, App.css |
| 19 | Final cleanup & build | Cleanup, build verification |
