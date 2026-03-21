import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

export type ToolProps = {
  clipboardText: string;
  clipboardMatch: boolean;
};

export type ToolMeta = {
  id: string;
  name: string;
  icon: string;
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
    icon: "{ }",
    shortcut: "1",
    component: lazy(() =>
      import("./json/JsonFormatter").then((m) => ({ default: m.JsonFormatter }))
    ),
    description: "Format, minify, and validate JSON",
    tags: ["json", "format", "minify", "validate", "pretty"],
    matchClipboard: (t) => { const s = t.trim(); return s.startsWith("{") || s.startsWith("["); },
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
    matchClipboard: (t) => { const s = t.trim(); return s.split(".").length === 3 && s.startsWith("ey"); },
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
    matchClipboard: () => false,
  },
  {
    id: "url",
    name: "URL Parser",
    icon: "🔗",
    shortcut: "4",
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
    icon: "🕐",
    shortcut: "5",
    component: lazy(() =>
      import("./timestamp/TimestampConverter").then((m) => ({ default: m.TimestampConverter }))
    ),
    description: "Convert between timestamp formats",
    tags: ["timestamp", "unix", "epoch", "date", "time", "iso"],
    matchClipboard: (t) => { const s = t.trim(); return /^\d{10,13}$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s); },
  },
  {
    id: "curl",
    name: "cURL Converter",
    icon: "⟩_",
    shortcut: "6",
    component: lazy(() =>
      import("./curl/CurlConverter").then((m) => ({ default: m.CurlConverter }))
    ),
    description: "Convert cURL commands to fetch, axios, or React Query",
    tags: ["curl", "fetch", "axios", "http", "api", "request", "react-query"],
    matchClipboard: (t) => t.trim().toLowerCase().startsWith("curl"),
  },
  {
    id: "color",
    name: "Color Converter",
    icon: "🎨",
    shortcut: "7",
    component: lazy(() =>
      import("./color/ColorConverter").then((m) => ({ default: m.ColorConverter }))
    ),
    description: "Convert between hex, RGB, and HSL color formats",
    tags: ["color", "hex", "rgb", "hsl", "css", "tailwind", "contrast"],
    matchClipboard: (t) => { const s = t.trim(); return /^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgba?\(/.test(s) || /^hsla?\(/.test(s); },
  },
];
