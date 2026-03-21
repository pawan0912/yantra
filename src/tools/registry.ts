import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
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

export type ToolProps = {
  clipboardText: string;
  clipboardMatch: boolean;
};

export type ToolMeta = {
  id: string;
  name: string;
  icon: LucideIcon;
  shortcut: string;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
  description: string;
  tags: string[];
  matchClipboard: (text: string) => boolean;
};

export const tools: ToolMeta[] = [
  {
    id: "json",
    name: "JSON Formatter",
    icon: Braces,
    shortcut: "1",
    component: lazy(() =>
      import("./json/JsonFormatter").then((m) => ({ default: m.JsonFormatter }))
    ),
    description: "Format, minify, and validate JSON",
    tags: ["json", "format", "minify", "validate", "pretty"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },
  {
    id: "diff",
    name: "Diff Viewer",
    icon: GitCompareArrows,
    shortcut: "2",
    component: lazy(() =>
      import("./diff/DiffViewer").then((m) => ({ default: m.DiffViewer }))
    ),
    description: "Compare two texts and see line-by-line differences",
    tags: ["diff", "compare", "merge", "text", "json", "config"],
    matchClipboard: () => false,
  },
  {
    id: "json-to-types",
    name: "JSON → Types",
    icon: FileType,
    shortcut: "3",
    component: lazy(() =>
      import("./json-to-types/JsonToTypes").then((m) => ({ default: m.JsonToTypes }))
    ),
    description: "Generate TypeScript interfaces or Zod schemas from JSON",
    tags: ["json", "typescript", "zod", "types", "interface", "schema", "codegen"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
  },
  {
    id: "jwt",
    name: "JWT Decoder",
    icon: KeyRound,
    shortcut: "4",
    component: lazy(() =>
      import("./jwt/JwtDecoder").then((m) => ({ default: m.JwtDecoder }))
    ),
    description: "Decode and inspect JWT tokens",
    tags: ["jwt", "token", "decode", "auth", "bearer"],
    matchClipboard: (t) => { const s = t.trim(); return s.split(".").length === 3 && s.startsWith("ey"); },
  },
  {
    id: "curl",
    name: "cURL Converter",
    icon: Terminal,
    shortcut: "5",
    component: lazy(() =>
      import("./curl/CurlConverter").then((m) => ({ default: m.CurlConverter }))
    ),
    description: "Convert cURL commands to fetch, axios, or React Query",
    tags: ["curl", "fetch", "axios", "http", "api", "request", "react-query"],
    matchClipboard: (t) => t.trim().toLowerCase().startsWith("curl"),
  },
  {
    id: "regex",
    name: "Regex Tester",
    icon: Regex,
    shortcut: "6",
    component: lazy(() =>
      import("./regex/RegexTester").then((m) => ({ default: m.RegexTester }))
    ),
    description: "Test regex patterns with live match highlighting",
    tags: ["regex", "regexp", "pattern", "match", "test", "replace"],
    matchClipboard: () => false,
  },
  {
    id: "url",
    name: "URL Parser",
    icon: Link,
    shortcut: "7",
    component: lazy(() =>
      import("./url/UrlParser").then((m) => ({ default: m.UrlParser }))
    ),
    description: "Parse, encode, and decode URLs",
    tags: ["url", "encode", "decode", "query", "params", "uri", "deeplink"],
    matchClipboard: (t) => /^https?:\/\//.test(t.trim()) || /^\w+:\/\//.test(t.trim()),
  },
  {
    id: "timestamp",
    name: "Timestamp",
    icon: Clock,
    shortcut: "8",
    component: lazy(() =>
      import("./timestamp/TimestampConverter").then((m) => ({ default: m.TimestampConverter }))
    ),
    description: "Convert between timestamp formats",
    tags: ["timestamp", "unix", "epoch", "date", "time", "iso"],
    matchClipboard: (t) => { const s = t.trim(); return /^\d{10,13}$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s); },
  },
  {
    id: "base64",
    name: "Base64",
    icon: Binary,
    shortcut: "9",
    component: lazy(() =>
      import("./base64/Base64Tool").then((m) => ({ default: m.Base64Tool }))
    ),
    description: "Encode and decode Base64 strings",
    tags: ["base64", "encode", "decode", "binary"],
    matchClipboard: () => false,
  },
  {
    id: "color",
    name: "Color Converter",
    icon: Palette,
    shortcut: "0",
    component: lazy(() =>
      import("./color/ColorConverter").then((m) => ({ default: m.ColorConverter }))
    ),
    description: "Convert between hex, RGB, and HSL color formats",
    tags: ["color", "hex", "rgb", "hsl", "css", "tailwind", "contrast"],
    matchClipboard: (t) => { const s = t.trim(); return /^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgba?\(/.test(s) || /^hsla?\(/.test(s); },
  },
];
