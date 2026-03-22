import { invoke } from "@tauri-apps/api/core";

// ── Types ──

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type KeyValuePair = {
  key: string;
  value: string;
  enabled: boolean;
};

export type AuthType = "none" | "bearer" | "basic";

export type AuthConfig = {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
};

export type RequestConfig = {
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: "json" | "raw" | "none";
  auth: AuthConfig;
};

export type ResponseData = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
};

export type HistoryEntry = {
  id: string;
  timestamp: number;
  request: RequestConfig;
  response: ResponseData;
};

// ── Constants ──

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-green-500",
  POST: "text-yellow-500",
  PUT: "text-blue-500",
  PATCH: "text-purple-500",
  DELETE: "text-red-500",
  HEAD: "text-gray-500",
  OPTIONS: "text-gray-400",
};

export const STATUS_COLORS: Record<string, string> = {
  "2": "text-green-500",  // 2xx
  "3": "text-blue-500",   // 3xx
  "4": "text-yellow-500", // 4xx
  "5": "text-red-500",    // 5xx
};

// ── Functions ──

export function createEmptyRequest(): RequestConfig {
  return {
    method: "GET",
    url: "",
    params: [{ key: "", value: "", enabled: true }],
    headers: [{ key: "Content-Type", value: "application/json", enabled: true }],
    body: "",
    bodyType: "none",
    auth: { type: "none" },
  };
}

export function createEmptyPair(): KeyValuePair {
  return { key: "", value: "", enabled: true };
}

export function buildUrlWithParams({ url, params }: { url: string; params: KeyValuePair[] }): string {
  const active = params.filter((p) => p.enabled && p.key.trim());
  if (active.length === 0) return url;

  const separator = url.includes("?") ? "&" : "?";
  const qs = active
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");

  return `${url}${separator}${qs}`;
}

export function buildHeaders({ headers, auth }: { headers: KeyValuePair[]; auth: AuthConfig }): Record<string, string> {
  const result: Record<string, string> = {};

  for (const h of headers) {
    if (h.enabled && h.key.trim()) {
      result[h.key] = h.value;
    }
  }

  // Apply auth
  if (auth.type === "bearer" && auth.token) {
    result["Authorization"] = `Bearer ${auth.token}`;
  } else if (auth.type === "basic" && auth.username) {
    const encoded = btoa(`${auth.username}:${auth.password || ""}`);
    result["Authorization"] = `Basic ${encoded}`;
  }

  return result;
}

export async function sendRequest({ config }: { config: RequestConfig }): Promise<ResponseData> {
  const fullUrl = buildUrlWithParams({ url: config.url, params: config.params });
  const headers = buildHeaders({ headers: config.headers, auth: config.auth });

  const body = config.bodyType !== "none" && config.body.trim() ? config.body : undefined;

  const response = await invoke<{
    status: number;
    status_text: string;
    headers: Record<string, string>;
    body: string;
    time_ms: number;
    size_bytes: number;
  }>("send_http_request", {
    request: {
      method: config.method,
      url: fullUrl,
      headers,
      body: body ?? null,
    },
  });

  return {
    status: response.status,
    statusText: response.status_text,
    headers: response.headers,
    body: response.body,
    timeMs: response.time_ms,
    sizeBytes: response.size_bytes,
  };
}

export function formatBytes({ bytes }: { bytes: number }): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor({ status }: { status: number }): string {
  const first = String(status)[0];
  return STATUS_COLORS[first] ?? "text-gray-500";
}

export function tryPrettyJson({ text }: { text: string }): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toCurl({ config }: { config: RequestConfig }): string {
  const fullUrl = buildUrlWithParams({ url: config.url, params: config.params });
  const headers = buildHeaders({ headers: config.headers, auth: config.auth });

  const parts = [`curl -X ${config.method}`];
  parts.push(`'${fullUrl}'`);

  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H '${key}: ${value}'`);
  }

  if (config.bodyType !== "none" && config.body.trim()) {
    parts.push(`-d '${config.body}'`);
  }

  return parts.join(" \\\n  ");
}
