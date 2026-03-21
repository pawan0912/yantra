import { describe, it, expect } from "bun:test";
import {
  computeDiff,
  formatUnifiedDiff,
  getDiffStats,
  isJsonLike,
  tryFormatJson,
} from "./diff.utils";

describe("computeDiff", () => {
  it("returns all unchanged for identical texts", () => {
    const lines = computeDiff({ oldText: "a\nb\nc", newText: "a\nb\nc" });
    expect(lines.every((l) => l.type === "unchanged")).toBe(true);
    expect(lines).toHaveLength(3);
  });

  it("detects added lines", () => {
    const lines = computeDiff({ oldText: "a\nb", newText: "a\nb\nc" });
    const added = lines.filter((l) => l.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0].content).toBe("c");
  });

  it("detects removed lines", () => {
    const lines = computeDiff({ oldText: "a\nb\nc", newText: "a\nc" });
    const removed = lines.filter((l) => l.type === "removed");
    expect(removed).toHaveLength(1);
    expect(removed[0].content).toBe("b");
  });

  it("handles mixed changes", () => {
    const lines = computeDiff({
      oldText: "line1\nline2\nline3",
      newText: "line1\nmodified\nline3\nline4",
    });
    const added = lines.filter((l) => l.type === "added");
    const removed = lines.filter((l) => l.type === "removed");
    const unchanged = lines.filter((l) => l.type === "unchanged");
    expect(added.length).toBeGreaterThan(0);
    expect(removed.length).toBeGreaterThan(0);
    expect(unchanged.length).toBeGreaterThan(0);
  });

  it("handles completely different texts", () => {
    const lines = computeDiff({ oldText: "aaa", newText: "bbb" });
    const added = lines.filter((l) => l.type === "added");
    const removed = lines.filter((l) => l.type === "removed");
    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(1);
  });

  it("handles empty old text (all added)", () => {
    const lines = computeDiff({ oldText: "", newText: "a\nb" });
    const added = lines.filter((l) => l.type === "added");
    expect(added.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty new text (all removed)", () => {
    const lines = computeDiff({ oldText: "a\nb", newText: "" });
    const removed = lines.filter((l) => l.type === "removed");
    expect(removed.length).toBeGreaterThanOrEqual(1);
  });

  it("handles both texts empty", () => {
    const lines = computeDiff({ oldText: "", newText: "" });
    // Both split to [""], so 1 unchanged empty line
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe("unchanged");
  });

  it("includes correct line numbers", () => {
    const lines = computeDiff({ oldText: "a\nb", newText: "a\nc" });
    const unchanged = lines.filter((l) => l.type === "unchanged");
    expect(unchanged[0].oldLineNum).toBe(1);
    expect(unchanged[0].newLineNum).toBe(1);
  });
});

describe("formatUnifiedDiff", () => {
  it("prefixes unchanged lines with space", () => {
    const output = formatUnifiedDiff({
      lines: [{ type: "unchanged", content: "hello" }],
    });
    expect(output).toBe(" hello");
  });

  it("prefixes added lines with +", () => {
    const output = formatUnifiedDiff({
      lines: [{ type: "added", content: "new line" }],
    });
    expect(output).toBe("+new line");
  });

  it("prefixes removed lines with -", () => {
    const output = formatUnifiedDiff({
      lines: [{ type: "removed", content: "old line" }],
    });
    expect(output).toBe("-old line");
  });

  it("formats multiple lines correctly", () => {
    const output = formatUnifiedDiff({
      lines: [
        { type: "unchanged", content: "a" },
        { type: "removed", content: "b" },
        { type: "added", content: "c" },
      ],
    });
    expect(output).toBe(" a\n-b\n+c");
  });
});

describe("getDiffStats", () => {
  it("counts added, removed, and unchanged lines", () => {
    const stats = getDiffStats({
      lines: [
        { type: "unchanged", content: "a" },
        { type: "added", content: "b" },
        { type: "added", content: "c" },
        { type: "removed", content: "d" },
      ],
    });
    expect(stats.added).toBe(2);
    expect(stats.removed).toBe(1);
    expect(stats.unchanged).toBe(1);
  });

  it("returns all zeros for empty lines", () => {
    const stats = getDiffStats({ lines: [] });
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
    expect(stats.unchanged).toBe(0);
  });
});

describe("isJsonLike", () => {
  it("returns true for object-like string", () => {
    expect(isJsonLike({ input: '{"key": "value"}' })).toBe(true);
  });

  it("returns true for array-like string", () => {
    expect(isJsonLike({ input: "[1, 2, 3]" })).toBe(true);
  });

  it("returns true with surrounding whitespace", () => {
    expect(isJsonLike({ input: '  {"a": 1}  ' })).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isJsonLike({ input: "hello world" })).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isJsonLike({ input: "" })).toBe(false);
  });
});

describe("tryFormatJson", () => {
  it("formats valid JSON with 2-space indentation", () => {
    const result = tryFormatJson({ input: '{"a":1,"b":2}' });
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("returns input unchanged for invalid JSON", () => {
    const input = "not json {";
    expect(tryFormatJson({ input })).toBe(input);
  });

  it("formats a JSON array", () => {
    const result = tryFormatJson({ input: "[1,2,3]" });
    expect(result).toBe("[\n  1,\n  2,\n  3\n]");
  });
});
