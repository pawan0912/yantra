import { describe, it, expect } from "bun:test";
import { encode, decode, isBase64Image, looksLikeBase64 } from "./base64.utils";

describe("encode", () => {
  it("encodes plain ASCII text", () => {
    expect(encode({ input: "hello" })).toBe("aGVsbG8=");
  });

  it("encodes an empty string", () => {
    expect(encode({ input: "" })).toBe("");
  });

  it("encodes text with special characters", () => {
    const encoded = encode({ input: "hello world!" });
    expect(encoded).toBe("aGVsbG8gd29ybGQh");
  });

  it("encodes unicode strings correctly", () => {
    const encoded = encode({ input: "cafe\u0301" });
    const decoded = decode({ input: encoded });
    expect(decoded).toBe("cafe\u0301");
  });

  it("encodes emoji correctly", () => {
    const encoded = encode({ input: "Hello 🌍" });
    const decoded = decode({ input: encoded });
    expect(decoded).toBe("Hello 🌍");
  });

  it("produces url-safe output when urlSafe is true", () => {
    // A string that produces + and / in standard base64
    const input = "subjects?_d";
    const standard = encode({ input });
    const urlSafe = encode({ input, urlSafe: true });
    expect(urlSafe).not.toContain("+");
    expect(urlSafe).not.toContain("/");
    expect(urlSafe).not.toContain("=");
    // Should still decode back
    const decoded = decode({ input: urlSafe });
    expect(decoded).toBe(input);
  });
});

describe("decode", () => {
  it("decodes standard base64", () => {
    expect(decode({ input: "aGVsbG8=" })).toBe("hello");
  });

  it("decodes base64 without padding", () => {
    expect(decode({ input: "aGVsbG8" })).toBe("hello");
  });

  it("decodes an empty string", () => {
    expect(decode({ input: "" })).toBe("");
  });

  it("decodes url-safe base64 (- and _ characters)", () => {
    const original = "subjects?_d";
    const urlSafe = encode({ input: original, urlSafe: true });
    expect(decode({ input: urlSafe })).toBe(original);
  });

  it("decodes unicode round-trip", () => {
    const original = "Hej v\u00e4rlden!";
    const encoded = encode({ input: original });
    expect(decode({ input: encoded })).toBe(original);
  });

  it("throws on invalid base64 input", () => {
    expect(() => decode({ input: "!!!invalid!!!" })).toThrow();
  });
});

describe("isBase64Image", () => {
  it("detects a PNG data URI", () => {
    const result = isBase64Image({ input: "data:image/png;base64,iVBOR..." });
    expect(result.isImage).toBe(true);
    expect(result.mimeType).toBe("image/png");
  });

  it("detects a JPEG data URI", () => {
    const result = isBase64Image({ input: "data:image/jpeg;base64,/9j/4..." });
    expect(result.isImage).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("detects SVG+XML data URI", () => {
    const result = isBase64Image({ input: "data:image/svg+xml;base64,PHN..." });
    expect(result.isImage).toBe(true);
    expect(result.mimeType).toBe("image/svg+xml");
  });

  it("returns false for non-image data URIs", () => {
    const result = isBase64Image({ input: "data:text/plain;base64,aGVsbG8=" });
    expect(result.isImage).toBe(false);
    expect(result.mimeType).toBeUndefined();
  });

  it("returns false for plain base64 strings", () => {
    const result = isBase64Image({ input: "aGVsbG8gd29ybGQ=" });
    expect(result.isImage).toBe(false);
  });
});

describe("looksLikeBase64", () => {
  it("returns true for long base64-like strings", () => {
    expect(looksLikeBase64({ input: "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q=" })).toBe(true);
  });

  it("returns true for data URIs", () => {
    expect(looksLikeBase64({ input: "data:image/png;base64,abc" })).toBe(true);
  });

  it("returns false for short strings", () => {
    expect(looksLikeBase64({ input: "abc" })).toBe(false);
  });

  it("returns false for strings shorter than 4 characters", () => {
    expect(looksLikeBase64({ input: "ab" })).toBe(false);
  });

  it("returns false for short non-base64 strings", () => {
    expect(looksLikeBase64({ input: "hello world" })).toBe(false);
  });

  it("returns false for strings with non-base64 characters under 20 length", () => {
    expect(looksLikeBase64({ input: "short!" })).toBe(false);
  });
});
