import { describe, it, expect } from "bun:test";
import {
  createEmptyRequest,
  createEmptyPair,
  buildUrlWithParams,
  buildHeaders,
  formatBytes,
  getStatusColor,
  tryPrettyJson,
  generateId,
  toCurl,
  HTTP_METHODS,
  METHOD_COLORS,
  STATUS_COLORS,
} from "./api-playground.utils";
import type { KeyValuePair, AuthConfig, RequestConfig } from "./api-playground.utils";

// ── createEmptyRequest ──

describe("createEmptyRequest", () => {
  it("returns a valid default request config", () => {
    const req = createEmptyRequest();
    expect(req.method).toBe("GET");
    expect(req.url).toBe("");
    expect(req.body).toBe("");
    expect(req.bodyType).toBe("none");
    expect(req.auth.type).toBe("none");
  });

  it("includes a default Content-Type header", () => {
    const req = createEmptyRequest();
    expect(req.headers.length).toBe(1);
    expect(req.headers[0].key).toBe("Content-Type");
    expect(req.headers[0].value).toBe("application/json");
    expect(req.headers[0].enabled).toBe(true);
  });

  it("includes one empty param row", () => {
    const req = createEmptyRequest();
    expect(req.params.length).toBe(1);
    expect(req.params[0].key).toBe("");
  });
});

// ── createEmptyPair ──

describe("createEmptyPair", () => {
  it("returns an enabled pair with empty key and value", () => {
    const pair = createEmptyPair();
    expect(pair.key).toBe("");
    expect(pair.value).toBe("");
    expect(pair.enabled).toBe(true);
  });
});

// ── buildUrlWithParams ──

describe("buildUrlWithParams", () => {
  it("returns url unchanged when no active params", () => {
    const url = "https://api.example.com";
    const params: KeyValuePair[] = [{ key: "", value: "", enabled: true }];
    expect(buildUrlWithParams({ url, params })).toBe(url);
  });

  it("appends single param with ?", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com",
      params: [{ key: "page", value: "1", enabled: true }],
    });
    expect(result).toBe("https://api.example.com?page=1");
  });

  it("appends multiple params with &", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com",
      params: [
        { key: "page", value: "1", enabled: true },
        { key: "limit", value: "10", enabled: true },
      ],
    });
    expect(result).toBe("https://api.example.com?page=1&limit=10");
  });

  it("uses & if url already has query string", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com?existing=true",
      params: [{ key: "page", value: "1", enabled: true }],
    });
    expect(result).toBe("https://api.example.com?existing=true&page=1");
  });

  it("skips disabled params", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com",
      params: [
        { key: "active", value: "yes", enabled: true },
        { key: "skip", value: "me", enabled: false },
      ],
    });
    expect(result).toBe("https://api.example.com?active=yes");
    expect(result).not.toContain("skip");
  });

  it("skips params with empty keys", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com",
      params: [
        { key: "", value: "orphan", enabled: true },
        { key: "valid", value: "yes", enabled: true },
      ],
    });
    expect(result).toBe("https://api.example.com?valid=yes");
  });

  it("encodes special characters in keys and values", () => {
    const result = buildUrlWithParams({
      url: "https://api.example.com",
      params: [{ key: "q", value: "hello world", enabled: true }],
    });
    expect(result).toBe("https://api.example.com?q=hello%20world");
  });
});

// ── buildHeaders ──

describe("buildHeaders", () => {
  it("builds headers from enabled pairs", () => {
    const headers: KeyValuePair[] = [
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "Accept", value: "text/html", enabled: true },
    ];
    const auth: AuthConfig = { type: "none" };
    const result = buildHeaders({ headers, auth });
    expect(result["Content-Type"]).toBe("application/json");
    expect(result["Accept"]).toBe("text/html");
  });

  it("skips disabled headers", () => {
    const headers: KeyValuePair[] = [
      { key: "Keep", value: "yes", enabled: true },
      { key: "Skip", value: "no", enabled: false },
    ];
    const result = buildHeaders({ headers, auth: { type: "none" } });
    expect(result["Keep"]).toBe("yes");
    expect(result["Skip"]).toBeUndefined();
  });

  it("skips headers with empty keys", () => {
    const headers: KeyValuePair[] = [
      { key: "", value: "orphan", enabled: true },
    ];
    const result = buildHeaders({ headers, auth: { type: "none" } });
    expect(Object.keys(result).length).toBe(0);
  });

  it("adds Bearer auth header", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "bearer", token: "my-jwt-token" },
    });
    expect(result["Authorization"]).toBe("Bearer my-jwt-token");
  });

  it("does not add Bearer header when token is empty", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "bearer", token: "" },
    });
    expect(result["Authorization"]).toBeUndefined();
  });

  it("adds Basic auth header", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "basic", username: "admin", password: "secret" },
    });
    const expected = `Basic ${btoa("admin:secret")}`;
    expect(result["Authorization"]).toBe(expected);
  });

  it("handles Basic auth with no password", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "basic", username: "admin" },
    });
    const expected = `Basic ${btoa("admin:")}`;
    expect(result["Authorization"]).toBe(expected);
  });

  it("does not add Basic header when username is empty", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "basic", username: "", password: "secret" },
    });
    expect(result["Authorization"]).toBeUndefined();
  });

  it("does not add auth when type is none", () => {
    const result = buildHeaders({
      headers: [],
      auth: { type: "none" },
    });
    expect(result["Authorization"]).toBeUndefined();
  });
});

// ── formatBytes ──

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes({ bytes: 0 })).toBe("0 B");
    expect(formatBytes({ bytes: 512 })).toBe("512 B");
    expect(formatBytes({ bytes: 1023 })).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes({ bytes: 1024 })).toBe("1.0 KB");
    expect(formatBytes({ bytes: 1536 })).toBe("1.5 KB");
    expect(formatBytes({ bytes: 10240 })).toBe("10.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes({ bytes: 1048576 })).toBe("1.0 MB");
    expect(formatBytes({ bytes: 2621440 })).toBe("2.5 MB");
  });
});

// ── getStatusColor ──

describe("getStatusColor", () => {
  it("returns green for 2xx", () => {
    expect(getStatusColor({ status: 200 })).toBe("text-green-500");
    expect(getStatusColor({ status: 201 })).toBe("text-green-500");
    expect(getStatusColor({ status: 204 })).toBe("text-green-500");
  });

  it("returns blue for 3xx", () => {
    expect(getStatusColor({ status: 301 })).toBe("text-blue-500");
    expect(getStatusColor({ status: 304 })).toBe("text-blue-500");
  });

  it("returns yellow for 4xx", () => {
    expect(getStatusColor({ status: 400 })).toBe("text-yellow-500");
    expect(getStatusColor({ status: 401 })).toBe("text-yellow-500");
    expect(getStatusColor({ status: 404 })).toBe("text-yellow-500");
  });

  it("returns red for 5xx", () => {
    expect(getStatusColor({ status: 500 })).toBe("text-red-500");
    expect(getStatusColor({ status: 503 })).toBe("text-red-500");
  });

  it("returns gray for unknown status codes", () => {
    expect(getStatusColor({ status: 100 })).toBe("text-gray-500");
  });
});

// ── tryPrettyJson ──

describe("tryPrettyJson", () => {
  it("pretty-prints valid JSON", () => {
    const result = tryPrettyJson({ text: '{"a":1,"b":2}' });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("pretty-prints JSON arrays", () => {
    const result = tryPrettyJson({ text: "[1,2,3]" });
    expect(result).toBe("[\n  1,\n  2,\n  3\n]");
  });

  it("returns original text for invalid JSON", () => {
    expect(tryPrettyJson({ text: "not json" })).toBe("not json");
    expect(tryPrettyJson({ text: "" })).toBe("");
  });

  it("handles already-formatted JSON", () => {
    const formatted = '{\n  "key": "value"\n}';
    const result = tryPrettyJson({ text: formatted });
    expect(result).toBe(formatted);
  });
});

// ── generateId ──

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("contains a timestamp and random suffix", () => {
    const id = generateId();
    expect(id).toContain("-");
    const [timestamp] = id.split("-");
    expect(Number(timestamp)).toBeGreaterThan(0);
  });
});

// ── toCurl ──

describe("toCurl", () => {
  const baseConfig: RequestConfig = {
    method: "GET",
    url: "https://api.example.com/users",
    params: [],
    headers: [],
    body: "",
    bodyType: "none",
    auth: { type: "none" },
  };

  it("generates simple GET curl", () => {
    const result = toCurl({ config: baseConfig });
    expect(result).toContain("curl -X GET");
    expect(result).toContain("'https://api.example.com/users'");
  });

  it("includes headers", () => {
    const config: RequestConfig = {
      ...baseConfig,
      headers: [
        { key: "Accept", value: "application/json", enabled: true },
        { key: "X-API-Key", value: "abc123", enabled: true },
      ],
    };
    const result = toCurl({ config });
    expect(result).toContain("-H 'Accept: application/json'");
    expect(result).toContain("-H 'X-API-Key: abc123'");
  });

  it("includes body for POST", () => {
    const config: RequestConfig = {
      ...baseConfig,
      method: "POST",
      body: '{"name":"test"}',
      bodyType: "json",
    };
    const result = toCurl({ config });
    expect(result).toContain("curl -X POST");
    expect(result).toContain("-d '{\"name\":\"test\"}'");
  });

  it("skips body when bodyType is none", () => {
    const config: RequestConfig = {
      ...baseConfig,
      body: "should not appear",
      bodyType: "none",
    };
    const result = toCurl({ config });
    expect(result).not.toContain("-d");
  });

  it("includes query params in URL", () => {
    const config: RequestConfig = {
      ...baseConfig,
      params: [{ key: "page", value: "1", enabled: true }],
    };
    const result = toCurl({ config });
    expect(result).toContain("page=1");
  });

  it("includes Bearer auth header", () => {
    const config: RequestConfig = {
      ...baseConfig,
      auth: { type: "bearer", token: "my-token" },
    };
    const result = toCurl({ config });
    expect(result).toContain("-H 'Authorization: Bearer my-token'");
  });

  it("includes Basic auth header", () => {
    const config: RequestConfig = {
      ...baseConfig,
      auth: { type: "basic", username: "user", password: "pass" },
    };
    const result = toCurl({ config });
    expect(result).toContain(`-H 'Authorization: Basic ${btoa("user:pass")}'`);
  });

  it("uses line continuation with backslashes", () => {
    const config: RequestConfig = {
      ...baseConfig,
      headers: [{ key: "Accept", value: "application/json", enabled: true }],
    };
    const result = toCurl({ config });
    expect(result).toContain(" \\\n  ");
  });
});

// ── Constants ──

describe("constants", () => {
  it("HTTP_METHODS contains all standard methods", () => {
    expect(HTTP_METHODS).toContain("GET");
    expect(HTTP_METHODS).toContain("POST");
    expect(HTTP_METHODS).toContain("PUT");
    expect(HTTP_METHODS).toContain("PATCH");
    expect(HTTP_METHODS).toContain("DELETE");
    expect(HTTP_METHODS).toContain("HEAD");
    expect(HTTP_METHODS).toContain("OPTIONS");
    expect(HTTP_METHODS.length).toBe(7);
  });

  it("METHOD_COLORS has a color for every method", () => {
    for (const method of HTTP_METHODS) {
      expect(METHOD_COLORS[method]).toBeDefined();
      expect(METHOD_COLORS[method]).toContain("text-");
    }
  });

  it("STATUS_COLORS covers 2xx through 5xx", () => {
    expect(STATUS_COLORS["2"]).toBeDefined();
    expect(STATUS_COLORS["3"]).toBeDefined();
    expect(STATUS_COLORS["4"]).toBeDefined();
    expect(STATUS_COLORS["5"]).toBeDefined();
  });
});
