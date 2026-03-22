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
  Globe,
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
  // ── JSON ──
  {
    id: "json",
    name: "JSON Formatter",
    description: "Format, minify, and validate JSON",
    icon: Braces,
    category: "json",
    component: lazy(() =>
      import("./json/JsonFormatter").then((m) => ({ default: m.JsonFormatter }))
    ),
    tags: ["json", "format", "minify", "validate", "pretty"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },
  {
    id: "json-to-types",
    name: "JSON → Types",
    description: "Generate TypeScript interfaces or Zod schemas from JSON",
    icon: FileType,
    category: "json",
    component: lazy(() =>
      import("./json-to-types/JsonToTypes").then((m) => ({ default: m.JsonToTypes }))
    ),
    tags: ["json", "typescript", "zod", "types", "interface", "schema", "codegen"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },

  // ── Text ──
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 strings",
    icon: Binary,
    category: "text",
    component: lazy(() =>
      import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool }))
    ),
    tags: ["base64", "encode", "decode", "binary"],
    matchClipboard: () => false,
  },
  {
    id: "diff",
    name: "Diff Viewer",
    description: "Compare two texts and see line-by-line differences",
    icon: GitCompareArrows,
    category: "text",
    component: lazy(() =>
      import("./diff/DiffViewer").then((m) => ({ default: m.DiffViewer }))
    ),
    tags: ["diff", "compare", "merge", "text", "json", "config"],
    matchClipboard: () => false,
  },
  {
    id: "regex",
    name: "Regex Tester",
    description: "Test regex patterns with live match highlighting",
    icon: Regex,
    category: "text",
    component: lazy(() =>
      import("./regex/RegexTester").then((m) => ({ default: m.RegexTester }))
    ),
    tags: ["regex", "regexp", "pattern", "match", "test", "replace"],
    matchClipboard: () => false,
  },

  // ── Web ──
  {
    id: "url",
    name: "URL Parser",
    description: "Parse, encode, and decode URLs",
    icon: Link,
    category: "web",
    component: lazy(() =>
      import("./url/UrlParser").then((m) => ({ default: m.UrlParser }))
    ),
    tags: ["url", "encode", "decode", "query", "params", "uri", "deeplink"],
    matchClipboard: (t) => /^https?:\/\//.test(t.trim()) || /^\w+:\/\//.test(t.trim()),
  },
  {
    id: "curl",
    name: "cURL Converter",
    description: "Convert cURL commands to fetch, axios, or React Query",
    icon: Terminal,
    category: "web",
    component: lazy(() =>
      import("./curl/CurlConverter").then((m) => ({ default: m.CurlConverter }))
    ),
    tags: ["curl", "fetch", "axios", "http", "api", "request", "react-query"],
    matchClipboard: (t) => t.trim().toLowerCase().startsWith("curl"),
  },
  {
    id: "jwt",
    name: "JWT Decoder",
    description: "Decode and inspect JWT tokens",
    icon: KeyRound,
    category: "web",
    component: lazy(() =>
      import("./jwt/JwtDecoder").then((m) => ({ default: m.JwtDecoder }))
    ),
    tags: ["jwt", "token", "decode", "auth", "bearer"],
    matchClipboard: (t) => { const s = t.trim(); return s.split(".").length === 3 && s.startsWith("ey"); },
  },
  {
    id: "api-playground",
    name: "API Playground",
    description: "Lightweight HTTP client — send requests, inspect responses",
    icon: Globe,
    category: "web",
    component: lazy(() =>
      import("./api-playground/ApiPlayground").then((m) => ({ default: m.ApiPlayground }))
    ),
    tags: ["api", "http", "rest", "request", "response", "postman", "curl", "fetch", "playground"],
    matchClipboard: (t) => /^https?:\/\//.test(t.trim()) || t.trim().toLowerCase().startsWith("curl"),
  },

  // ── Misc ──
  {
    id: "timestamp",
    name: "Timestamp",
    description: "Convert between timestamp formats",
    icon: Clock,
    category: "misc",
    component: lazy(() =>
      import("./timestamp/TimestampConverter").then((m) => ({ default: m.TimestampConverter }))
    ),
    tags: ["timestamp", "unix", "epoch", "date", "time", "iso"],
    matchClipboard: (t) => { const s = t.trim(); return /^\d{10,13}$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s); },
  },
  {
    id: "color",
    name: "Color Converter",
    description: "Convert between hex, RGB, and HSL color formats",
    icon: Palette,
    category: "misc",
    component: lazy(() =>
      import("./color/ColorConverter").then((m) => ({ default: m.ColorConverter }))
    ),
    tags: ["color", "hex", "rgb", "hsl", "css", "tailwind", "contrast"],
    matchClipboard: (t) => { const s = t.trim(); return /^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgba?\(/.test(s) || /^hsla?\(/.test(s); },
  },
];
