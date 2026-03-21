import { describe, it, expect } from "bun:test";
import { parseUrl, buildUrl, encodeUrlString, decodeUrlString, isLikelyUrl } from "./url.utils";

describe("parseUrl", () => {
  it("parses a full URL with protocol, host, path, query, and hash", () => {
    const result = parseUrl({ input: "https://example.com/path?key=value#section" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.protocol).toBe("https");
    expect(result.host).toBe("example.com");
    expect(result.pathname).toBe("/path");
    expect(result.hash).toBe("#section");
    expect(result.params).toEqual([{ key: "key", value: "value" }]);
  });

  it("parses multiple query parameters", () => {
    const result = parseUrl({ input: "https://example.com/?a=1&b=2&c=3" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.params).toEqual([
      { key: "a", value: "1" },
      { key: "b", value: "2" },
      { key: "c", value: "3" },
    ]);
  });

  it("parses URL with no query params", () => {
    const result = parseUrl({ input: "https://example.com/about" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.params).toEqual([]);
    expect(result.pathname).toBe("/about");
  });

  it("parses URL with no path", () => {
    const result = parseUrl({ input: "https://example.com" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.pathname).toBe("/");
    expect(result.host).toBe("example.com");
  });

  it("parses URL with no hash", () => {
    const result = parseUrl({ input: "https://example.com/page?q=test" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.hash).toBe("");
  });

  it("strips trailing colon from protocol", () => {
    const result = parseUrl({ input: "http://example.com" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.protocol).toBe("http");
  });

  it("handles URL-encoded query values", () => {
    const result = parseUrl({ input: "https://example.com?q=hello%20world" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.params[0].value).toBe("hello world");
  });

  it("returns invalid for malformed input", () => {
    const result = parseUrl({ input: "not a url" });
    expect(result.isValid).toBe(false);
    if (result.isValid) return;
    expect(result.error).toContain("Invalid URL");
  });

  it("includes host with port", () => {
    const result = parseUrl({ input: "http://localhost:3000/api" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.host).toBe("localhost:3000");
  });
});

describe("buildUrl", () => {
  it("builds a complete URL from parts", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/path",
      hash: "#section",
      params: [{ key: "a", value: "1" }],
    });
    expect(result).toBe("https://example.com/path?a=1#section");
  });

  it("builds URL with no params", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/",
      hash: "",
      params: [],
    });
    expect(result).toBe("https://example.com/");
  });

  it("builds URL with multiple params", () => {
    const result = buildUrl({
      protocol: "https",
      host: "api.test.com",
      pathname: "/search",
      hash: "",
      params: [
        { key: "q", value: "test" },
        { key: "page", value: "2" },
      ],
    });
    expect(result).toBe("https://api.test.com/search?q=test&page=2");
  });

  it("encodes special characters in params", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/",
      hash: "",
      params: [{ key: "q", value: "hello world" }],
    });
    expect(result).toContain("q=hello%20world");
  });

  it("filters out params with empty keys", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/",
      hash: "",
      params: [
        { key: "", value: "ignored" },
        { key: "a", value: "1" },
      ],
    });
    expect(result).toBe("https://example.com/?a=1");
  });

  it("prepends # to hash if missing", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/",
      hash: "top",
      params: [],
    });
    expect(result).toBe("https://example.com/#top");
  });

  it("does not double-prepend # to hash", () => {
    const result = buildUrl({
      protocol: "https",
      host: "example.com",
      pathname: "/",
      hash: "#top",
      params: [],
    });
    expect(result).toBe("https://example.com/#top");
  });
});

describe("encodeUrlString", () => {
  it("encodes special characters", () => {
    expect(encodeUrlString({ input: "hello world" })).toBe("hello%20world");
  });

  it("encodes ampersands and equals", () => {
    expect(encodeUrlString({ input: "a=1&b=2" })).toBe("a%3D1%26b%3D2");
  });
});

describe("decodeUrlString", () => {
  it("decodes percent-encoded strings", () => {
    expect(decodeUrlString({ input: "hello%20world" })).toBe("hello world");
  });

  it("returns original string if decoding fails", () => {
    expect(decodeUrlString({ input: "%E0%A4%A" })).toBe("%E0%A4%A");
  });

  it("handles already-decoded strings", () => {
    expect(decodeUrlString({ input: "hello" })).toBe("hello");
  });
});

describe("isLikelyUrl", () => {
  it("returns true for http URLs", () => {
    expect(isLikelyUrl({ input: "http://example.com" })).toBe(true);
  });

  it("returns true for https URLs", () => {
    expect(isLikelyUrl({ input: "https://example.com" })).toBe(true);
  });

  it("returns true for ftp URLs", () => {
    expect(isLikelyUrl({ input: "ftp://files.example.com" })).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isLikelyUrl({ input: "just some text" })).toBe(false);
  });

  it("returns false for email-like strings", () => {
    expect(isLikelyUrl({ input: "user@example.com" })).toBe(false);
  });

  it("trims whitespace before checking", () => {
    expect(isLikelyUrl({ input: "  https://example.com  " })).toBe(true);
  });
});
