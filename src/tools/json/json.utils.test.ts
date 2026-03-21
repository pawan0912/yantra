import { describe, it, expect } from "bun:test";
import { formatJson, minifyJson, validateJson, getJsonMeta, highlightJson } from "./json.utils";

describe("formatJson", () => {
  it("formats valid JSON with default indent of 2", () => {
    const result = formatJson({ input: '{"a":1,"b":2}' });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("formats with custom indent", () => {
    const result = formatJson({ input: '{"a":1}', indent: 4 });
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it("formats nested objects and arrays", () => {
    const input = '{"a":{"b":[1,2,3]}}';
    const result = formatJson({ input });
    expect(result).toContain('"b": [\n');
    expect(result).toContain("    1,\n");
  });

  it("throws on invalid JSON", () => {
    expect(() => formatJson({ input: "{bad}" })).toThrow();
  });

  it("handles empty object", () => {
    expect(formatJson({ input: "{}" })).toBe("{}");
  });

  it("handles empty array", () => {
    expect(formatJson({ input: "[]" })).toBe("[]");
  });

  it("handles null", () => {
    expect(formatJson({ input: "null" })).toBe("null");
  });

  it("handles numbers", () => {
    expect(formatJson({ input: "42" })).toBe("42");
  });

  it("handles strings", () => {
    expect(formatJson({ input: '"hello"' })).toBe('"hello"');
  });
});

describe("minifyJson", () => {
  it("removes whitespace from formatted JSON", () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    expect(minifyJson({ input })).toBe('{"a":1,"b":2}');
  });

  it("minifies nested structures", () => {
    const input = '{\n  "a": {\n    "b": [1, 2]\n  }\n}';
    expect(minifyJson({ input })).toBe('{"a":{"b":[1,2]}}');
  });

  it("throws on invalid JSON", () => {
    expect(() => minifyJson({ input: "not json" })).toThrow();
  });
});

describe("validateJson", () => {
  it("returns valid for correct JSON", () => {
    expect(validateJson({ input: '{"a":1}' })).toEqual({ valid: true });
  });

  it("returns valid for arrays", () => {
    expect(validateJson({ input: "[1,2,3]" })).toEqual({ valid: true });
  });

  it("returns valid for primitives", () => {
    expect(validateJson({ input: "null" })).toEqual({ valid: true });
    expect(validateJson({ input: "true" })).toEqual({ valid: true });
    expect(validateJson({ input: "42" })).toEqual({ valid: true });
  });

  it("returns invalid with error for bad JSON", () => {
    const result = validateJson({ input: "{bad}" });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns invalid for trailing commas", () => {
    const result = validateJson({ input: '{"a":1,}' });
    expect(result.valid).toBe(false);
  });
});

describe("getJsonMeta", () => {
  it("counts keys in a flat object", () => {
    const meta = getJsonMeta({ input: '{"a":1,"b":2,"c":3}' });
    expect(meta.keyCount).toBe(3);
  });

  it("counts keys in nested objects", () => {
    const meta = getJsonMeta({ input: '{"a":{"b":1},"c":2}' });
    expect(meta.keyCount).toBe(3);
  });

  it("computes maxDepth", () => {
    const meta = getJsonMeta({ input: '{"a":{"b":{"c":1}}}' });
    expect(meta.maxDepth).toBe(3);
  });

  it("tracks array lengths", () => {
    const meta = getJsonMeta({ input: '{"items":[1,2,3]}' });
    expect(meta.arrayLengths["items"]).toBe(3);
  });

  it("handles root array", () => {
    const meta = getJsonMeta({ input: "[1,2,3,4]" });
    expect(meta.arrayLengths["root"]).toBe(4);
  });

  it("handles empty object with zero keys and depth 0", () => {
    const meta = getJsonMeta({ input: "{}" });
    expect(meta.keyCount).toBe(0);
    expect(meta.maxDepth).toBe(0);
  });
});

describe("highlightJson", () => {
  it("wraps keys in bold spans", () => {
    const result = highlightJson({ json: '"name": "value"' });
    expect(result).toContain('<span style="font-weight:600">"name"</span>');
  });

  it("wraps string values in green spans", () => {
    const result = highlightJson({ json: '"key": "value"' });
    expect(result).toContain('<span style="color:#16a34a">"value"</span>');
  });

  it("wraps numbers in blue spans", () => {
    const result = highlightJson({ json: '"count": 42' });
    expect(result).toContain('<span style="color:#2563eb">42</span>');
  });

  it("wraps booleans in orange spans", () => {
    const result = highlightJson({ json: '"active": true' });
    expect(result).toContain('<span style="color:#ea580c">true</span>');
  });

  it("wraps null in gray spans", () => {
    const result = highlightJson({ json: '"val": null' });
    expect(result).toContain('<span style="color:#9ca3af">null</span>');
  });

  it("escapes HTML entities", () => {
    const result = highlightJson({ json: '"a": "<b>"' });
    expect(result).toContain("&lt;b&gt;");
    expect(result).not.toContain("<b>");
  });
});
