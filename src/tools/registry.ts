import { lazy } from "react";
import {
  Braces,
  KeyRound,
  Binary,
  Link,
  Clock,
  Terminal,
  Palette,
  FileType,
  Regex,
  GitCompareArrows,
} from "lucide-react";
import type { ToolPlugin } from "./types";

// Re-export types for convenience
export type { ToolProps, ToolPlugin, ToolCategory, ToolConfig } from "./types";
export { TOOL_CATEGORIES } from "./types";

/**
 * All registered tools. Order here defines the default display order.
 * Each tool fully describes itself — the shell knows nothing tool-specific.
 */
export const tools: ToolPlugin[] = [
  // ── Transform ──
  {
    id: "json",
    name: "JSON Formatter",
    description: "Format, minify, and validate JSON",
    icon: Braces,
    category: "transform",
    shortcut: "1",
    component: lazy(() =>
      import("./json/JsonFormatter").then((m) => ({ default: m.JsonFormatter }))
    ),
    tags: ["json", "format", "minify", "validate", "pretty"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 strings",
    icon: Binary,
    category: "transform",
    shortcut: "9",
    component: lazy(() =>
      import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool }))
    ),
    tags: ["base64", "encode", "decode", "binary"],
    matchClipboard: () => false,
  },
  {
    id: "url",
    name: "URL Parser",
    description: "Parse, encode, and decode URLs",
    icon: Link,
    category: "transform",
    shortcut: "7",
    component: lazy(() =>
      import("./url/UrlParser").then((m) => ({ default: m.UrlParser }))
    ),
    tags: ["url", "encode", "decode", "query", "params", "uri", "deeplink"],
    matchClipboard: (t) => /^https?:\/\//.test(t.trim()) || /^\w+:\/\//.test(t.trim()),
  },
  {
    id: "color",
    name: "Color Converter",
    description: "Convert between hex, RGB, and HSL color formats",
    icon: Palette,
    category: "transform",
    shortcut: "0",
    component: lazy(() =>
      import("./color/ColorConverter").then((m) => ({ default: m.ColorConverter }))
    ),
    tags: ["color", "hex", "rgb", "hsl", "css", "tailwind", "contrast"],
    matchClipboard: (t) => { const s = t.trim(); return /^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgba?\(/.test(s) || /^hsla?\(/.test(s); },
  },
  {
    id: "curl",
    name: "cURL Converter",
    description: "Convert cURL commands to fetch, axios, or React Query",
    icon: Terminal,
    category: "transform",
    shortcut: "5",
    component: lazy(() =>
      import("./curl/CurlConverter").then((m) => ({ default: m.CurlConverter }))
    ),
    tags: ["curl", "fetch", "axios", "http", "api", "request", "react-query"],
    matchClipboard: (t) => t.trim().toLowerCase().startsWith("curl"),
  },

  // ── Generate ──
  {
    id: "json-to-types",
    name: "JSON → Types",
    description: "Generate TypeScript interfaces or Zod schemas from JSON",
    icon: FileType,
    category: "generate",
    shortcut: "3",
    component: lazy(() =>
      import("./json-to-types/JsonToTypes").then((m) => ({ default: m.JsonToTypes }))
    ),
    tags: ["json", "typescript", "zod", "types", "interface", "schema", "codegen"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },
  {
    id: "regex",
    name: "Regex Tester",
    description: "Test regex patterns with live match highlighting",
    icon: Regex,
    category: "generate",
    shortcut: "6",
    component: lazy(() =>
      import("./regex/RegexTester").then((m) => ({ default: m.RegexTester }))
    ),
    tags: ["regex", "regexp", "pattern", "match", "test", "replace"],
    matchClipboard: () => false,
  },

  // ── Compare ──
  {
    id: "diff",
    name: "Diff Viewer",
    description: "Compare two texts and see line-by-line differences",
    icon: GitCompareArrows,
    category: "compare",
    shortcut: "2",
    component: lazy(() =>
      import("./diff/DiffViewer").then((m) => ({ default: m.DiffViewer }))
    ),
    tags: ["diff", "compare", "merge", "text", "json", "config"],
    matchClipboard: () => false,
  },

  // ── Inspect ──
  {
    id: "jwt",
    name: "JWT Decoder",
    description: "Decode and inspect JWT tokens",
    icon: KeyRound,
    category: "inspect",
    shortcut: "4",
    component: lazy(() =>
      import("./jwt/JwtDecoder").then((m) => ({ default: m.JwtDecoder }))
    ),
    tags: ["jwt", "token", "decode", "auth", "bearer"],
    matchClipboard: (t) => { const s = t.trim(); return s.split(".").length === 3 && s.startsWith("ey"); },
  },
  {
    id: "timestamp",
    name: "Timestamp",
    description: "Convert between timestamp formats",
    icon: Clock,
    category: "inspect",
    shortcut: "8",
    component: lazy(() =>
      import("./timestamp/TimestampConverter").then((m) => ({ default: m.TimestampConverter }))
    ),
    tags: ["timestamp", "unix", "epoch", "date", "time", "iso"],
    matchClipboard: (t) => { const s = t.trim(); return /^\d{10,13}$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s); },
  },
];
