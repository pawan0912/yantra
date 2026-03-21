import { describe, it, expect } from "bun:test";
import {
  isCurlCommand,
  parseCurl,
  toFetch,
  toAxios,
  toReactQuery,
} from "./curl.utils";

describe("isCurlCommand", () => {
  it("returns true for a simple curl command", () => {
    expect(isCurlCommand({ input: "curl https://example.com" })).toBe(true);
  });

  it("returns true regardless of case", () => {
    expect(isCurlCommand({ input: "CURL https://example.com" })).toBe(true);
  });

  it("returns true with leading whitespace", () => {
    expect(isCurlCommand({ input: "  curl https://example.com" })).toBe(true);
  });

  it("returns true with backslash-continued lines", () => {
    expect(
      isCurlCommand({ input: "curl \\\n  https://example.com" })
    ).toBe(true);
  });

  it("returns false for non-curl input", () => {
    expect(isCurlCommand({ input: "wget https://example.com" })).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(isCurlCommand({ input: "" })).toBe(false);
  });
});

describe("parseCurl", () => {
  it("parses a simple GET command", () => {
    const result = parseCurl({ input: "curl https://api.example.com/users" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("GET");
    expect(result.url).toBe("https://api.example.com/users");
    expect(result.body).toBeNull();
    expect(result.auth).toBeNull();
  });

  it("parses POST with -d data flag", () => {
    const result = parseCurl({
      input: `curl -d '{"name":"test"}' https://api.example.com/users`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("POST");
    expect(result.body).toBe('{"name":"test"}');
  });

  it("parses with multiple -H headers", () => {
    const result = parseCurl({
      input: `curl -H "Content-Type: application/json" -H "Authorization: Bearer tok123" https://api.example.com`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.headers["Authorization"]).toBe("Bearer tok123");
  });

  it("parses with -X method override", () => {
    const result = parseCurl({
      input: `curl -X PUT https://api.example.com/users/1`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("PUT");
  });

  it("parses with --data-raw", () => {
    const result = parseCurl({
      input: `curl --data-raw '{"key":"val"}' https://api.example.com`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("POST");
    expect(result.body).toBe('{"key":"val"}');
  });

  it("parses with --data-binary", () => {
    const result = parseCurl({
      input: `curl --data-binary '@file.txt' https://api.example.com/upload`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("POST");
    expect(result.body).toBe("@file.txt");
  });

  it("parses with -u user:pass (basic auth)", () => {
    const result = parseCurl({
      input: `curl -u admin:secret https://api.example.com`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.auth).toEqual({ type: "basic", value: "admin:secret" });
  });

  it("infers POST when body is present without explicit method", () => {
    const result = parseCurl({
      input: `curl -d "data=hello" https://api.example.com`,
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("POST");
  });

  it("returns error for non-curl input", () => {
    const result = parseCurl({ input: "wget https://example.com" });
    expect(result.isValid).toBe(false);
    if (result.isValid) return;
    expect(result.error).toContain("curl");
  });

  it("returns error for curl with no URL", () => {
    const result = parseCurl({ input: "curl -H 'X-Key: val'" });
    expect(result.isValid).toBe(false);
    if (result.isValid) return;
    expect(result.error).toContain("URL");
  });

  it("returns error for empty input", () => {
    const result = parseCurl({ input: "" });
    expect(result.isValid).toBe(false);
  });

  it("handles backslash-continued multiline commands", () => {
    const input = `curl \\\n  -X POST \\\n  -H "Content-Type: application/json" \\\n  https://api.example.com`;
    const result = parseCurl({ input });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.method).toBe("POST");
    expect(result.url).toBe("https://api.example.com");
  });
});

describe("toFetch", () => {
  it("generates simple fetch for GET with no headers or body", () => {
    const code = toFetch({
      method: "GET",
      url: "https://api.example.com",
      headers: {},
      body: null,
    });
    expect(code).toContain("await fetch(");
    expect(code).toContain("https://api.example.com");
    expect(code).not.toContain("method:");
  });

  it("includes method, headers, and body for POST", () => {
    const code = toFetch({
      method: "POST",
      url: "https://api.example.com",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"test"}',
    });
    expect(code).toContain('method: "POST"');
    expect(code).toContain("Content-Type");
    expect(code).toContain("JSON.stringify");
  });

  it("handles non-JSON body as a string", () => {
    const code = toFetch({
      method: "POST",
      url: "https://api.example.com",
      headers: {},
      body: "key=value",
    });
    expect(code).toContain("body:");
    expect(code).not.toContain("JSON.stringify");
  });
});

describe("toAxios", () => {
  it("generates simple axios call for GET with no extras", () => {
    const code = toAxios({
      method: "GET",
      url: "https://api.example.com",
      headers: {},
      body: null,
    });
    expect(code).toContain("axios.get(");
    expect(code).toContain("https://api.example.com");
  });

  it("includes body as second argument for POST", () => {
    const code = toAxios({
      method: "POST",
      url: "https://api.example.com",
      headers: {},
      body: '{"name":"test"}',
    });
    expect(code).toContain("axios.post(");
    expect(code).toContain('{"name":"test"}');
  });

  it("includes headers in config object", () => {
    const code = toAxios({
      method: "GET",
      url: "https://api.example.com",
      headers: { Authorization: "Bearer tok" },
      body: null,
    });
    expect(code).toContain("headers:");
    expect(code).toContain("Authorization");
  });
});

describe("toReactQuery", () => {
  it("generates useQuery for GET requests", () => {
    const code = toReactQuery({
      method: "GET",
      url: "https://api.example.com/users",
      headers: {},
      body: null,
    });
    expect(code).toContain("useQuery(");
    expect(code).toContain("queryKey:");
    expect(code).toContain("queryFn:");
  });

  it("generates useMutation for POST requests", () => {
    const code = toReactQuery({
      method: "POST",
      url: "https://api.example.com/users",
      headers: {},
      body: '{"name":"test"}',
    });
    expect(code).toContain("useMutation(");
    expect(code).toContain("mutationFn:");
    expect(code).toContain("onSuccess:");
  });

  it("generates useMutation for DELETE requests", () => {
    const code = toReactQuery({
      method: "DELETE",
      url: "https://api.example.com/users/1",
      headers: {},
      body: null,
    });
    expect(code).toContain("useMutation(");
  });
});
