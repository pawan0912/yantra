import { describe, it, expect } from "bun:test";
import {
  jsonToTypeScript,
  jsonToZod,
  countFields,
  detectJsonType,
} from "./json-to-types.utils";

describe("detectJsonType", () => {
  it("detects null", () => {
    expect(detectJsonType({ value: null })).toBe("null");
  });

  it("detects string", () => {
    expect(detectJsonType({ value: "hello" })).toBe("string");
  });

  it("detects number", () => {
    expect(detectJsonType({ value: 42 })).toBe("number");
  });

  it("detects boolean", () => {
    expect(detectJsonType({ value: true })).toBe("boolean");
  });

  it("detects array", () => {
    expect(detectJsonType({ value: [1, 2, 3] })).toBe("array");
  });

  it("detects object", () => {
    expect(detectJsonType({ value: { a: 1 } })).toBe("object");
  });
});

describe("jsonToTypeScript", () => {
  it("generates interface for a simple object", () => {
    const result = jsonToTypeScript({ input: '{"name":"Alice","age":30}' });
    expect(result).toContain("export interface Root");
    expect(result).toContain("name: string;");
    expect(result).toContain("age: number;");
  });

  it("handles nested objects", () => {
    const result = jsonToTypeScript({
      input: '{"user":{"name":"Alice","email":"a@b.com"}}',
    });
    expect(result).toContain("export interface Root");
    expect(result).toContain("export interface User");
    expect(result).toContain("user: User;");
  });

  it("handles typed arrays", () => {
    const result = jsonToTypeScript({ input: '{"tags":["a","b","c"]}' });
    expect(result).toContain("tags: string[];");
  });

  it("handles empty arrays as unknown[]", () => {
    const result = jsonToTypeScript({ input: '{"items":[]}' });
    expect(result).toContain("items: unknown[];");
  });

  it("handles mixed-type arrays with union", () => {
    const result = jsonToTypeScript({ input: '{"data":[1,"two",true]}' });
    expect(result).toContain("number | string | boolean");
    expect(result).toContain("[]");
  });

  it("handles nullable fields with optional marker", () => {
    const result = jsonToTypeScript({ input: '{"value":null}' });
    expect(result).toContain("value?: null;");
  });

  it("generates type alias for primitive root", () => {
    const result = jsonToTypeScript({ input: '"hello"' });
    expect(result).toContain("export type Root = string;");
  });

  it("generates type alias for array root", () => {
    const result = jsonToTypeScript({ input: "[1, 2, 3]" });
    expect(result).toContain("export type Root = number[];");
  });

  it("uses custom root name", () => {
    const result = jsonToTypeScript({
      input: '{"id":1}',
      rootName: "User",
    });
    expect(result).toContain("export interface User");
  });

  it("throws on invalid JSON", () => {
    expect(() => jsonToTypeScript({ input: "not json" })).toThrow();
  });
});

describe("jsonToZod", () => {
  it("generates Zod schema for a simple object", () => {
    const result = jsonToZod({ input: '{"name":"Alice","age":30}' });
    expect(result).toContain('import { z } from "zod"');
    expect(result).toContain("rootSchema");
    expect(result).toContain("z.object(");
    expect(result).toContain("z.string()");
    expect(result).toContain("z.number()");
  });

  it("generates nested schemas for nested objects", () => {
    const result = jsonToZod({
      input: '{"user":{"name":"Alice"}}',
    });
    expect(result).toContain("rootSchema");
    expect(result).toContain("userSchema");
    expect(result).toContain("z.object(");
  });

  it("handles arrays with z.array()", () => {
    const result = jsonToZod({ input: '{"tags":["a","b"]}' });
    expect(result).toContain("z.array(z.string())");
  });

  it("handles empty arrays as z.array(z.unknown())", () => {
    const result = jsonToZod({ input: '{"items":[]}' });
    expect(result).toContain("z.array(z.unknown())");
  });

  it("adds datetime comment for ISO date strings", () => {
    const result = jsonToZod({ input: '{"created":"2024-01-15T10:30:00Z"}' });
    expect(result).toContain("datetime()");
  });

  it("handles null fields with z.nullable", () => {
    const result = jsonToZod({ input: '{"value":null}' });
    expect(result).toContain("z.nullable(z.unknown())");
  });

  it("uses custom root name", () => {
    const result = jsonToZod({ input: '{"id":1}', rootName: "User" });
    expect(result).toContain("userSchema");
  });

  it("throws on invalid JSON", () => {
    expect(() => jsonToZod({ input: "{bad" })).toThrow();
  });
});

describe("countFields", () => {
  it("counts top-level fields", () => {
    expect(countFields({ input: '{"a":1,"b":2,"c":3}' })).toBe(3);
  });

  it("counts nested fields", () => {
    expect(countFields({ input: '{"a":1,"b":{"c":2,"d":3}}' })).toBe(4);
  });

  it("counts zero fields for an array root", () => {
    expect(countFields({ input: "[1, 2, 3]" })).toBe(0);
  });

  it("counts fields inside arrays of objects", () => {
    expect(countFields({ input: '{"items":[{"x":1},{"y":2}]}' })).toBe(3);
  });

  it("throws on invalid JSON", () => {
    expect(() => countFields({ input: "nope" })).toThrow();
  });
});
