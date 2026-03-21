import { describe, it, expect } from "bun:test";
import {
  testRegex,
  getMatchRanges,
  highlightMatches,
  validatePattern,
  isRegexLike,
  REGEX_PRESETS,
} from "./regex.utils";

describe("validatePattern", () => {
  it("returns valid for a correct pattern", () => {
    expect(validatePattern({ pattern: "\\d+" })).toEqual({ valid: true });
  });

  it("returns invalid with error for a broken pattern", () => {
    const result = validatePattern({ pattern: "[unclosed" });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns valid for an empty pattern", () => {
    expect(validatePattern({ pattern: "" }).valid).toBe(true);
  });
});

describe("testRegex", () => {
  it("finds a single match without global flag", () => {
    const result = testRegex({
      pattern: "\\d+",
      flags: "",
      testString: "abc 123 def 456",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matchCount).toBe(1);
    expect(result.matches[0].fullMatch).toBe("123");
    expect(result.matches[0].index).toBe(4);
    expect(result.matches[0].length).toBe(3);
  });

  it("finds multiple matches with global flag", () => {
    const result = testRegex({
      pattern: "\\d+",
      flags: "g",
      testString: "abc 123 def 456",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matchCount).toBe(2);
    expect(result.matches[0].fullMatch).toBe("123");
    expect(result.matches[1].fullMatch).toBe("456");
  });

  it("returns zero matches when nothing matches", () => {
    const result = testRegex({
      pattern: "\\d+",
      flags: "g",
      testString: "no digits here",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matchCount).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it("captures named groups", () => {
    const result = testRegex({
      pattern: "(?<year>\\d{4})-(?<month>\\d{2})",
      flags: "",
      testString: "date: 2024-03",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matches[0].groups).toEqual({ year: "2024", month: "03" });
  });

  it("returns null groups when no named groups exist", () => {
    const result = testRegex({
      pattern: "(\\d+)",
      flags: "",
      testString: "test 42",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matches[0].groups).toBeNull();
  });

  it("returns empty matches for empty pattern", () => {
    const result = testRegex({
      pattern: "",
      flags: "g",
      testString: "anything",
    });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.matchCount).toBe(0);
  });

  it("returns error for invalid pattern", () => {
    const result = testRegex({
      pattern: "[invalid",
      flags: "g",
      testString: "test",
    });
    expect(result.isValid).toBe(false);
    if (result.isValid) return;
    expect(result.error).toBeDefined();
  });
});

describe("getMatchRanges", () => {
  it("returns correct start and end positions", () => {
    const ranges = getMatchRanges({
      pattern: "\\d+",
      flags: "g",
      testString: "abc 123 def 456",
    });
    expect(ranges).toEqual([
      { start: 4, end: 7 },
      { start: 12, end: 15 },
    ]);
  });

  it("returns empty array for no matches", () => {
    const ranges = getMatchRanges({
      pattern: "xyz",
      flags: "g",
      testString: "no match",
    });
    expect(ranges).toEqual([]);
  });

  it("returns empty array for invalid pattern", () => {
    const ranges = getMatchRanges({
      pattern: "[bad",
      flags: "g",
      testString: "test",
    });
    expect(ranges).toEqual([]);
  });
});

describe("highlightMatches", () => {
  it("returns escaped text with no ranges", () => {
    const html = highlightMatches({
      testString: "hello <world>",
      ranges: [],
    });
    expect(html).toBe("hello &lt;world&gt;");
  });

  it("wraps matched ranges in span elements with inline styles", () => {
    const html = highlightMatches({
      testString: "abc 123 def",
      ranges: [{ start: 4, end: 7 }],
    });
    expect(html).toContain("<span style=");
    expect(html).toContain("123");
    expect(html).toContain("abc ");
    expect(html).toContain(" def");
  });

  it("alternates colors for multiple matches", () => {
    const html = highlightMatches({
      testString: "a1b2c3",
      ranges: [
        { start: 1, end: 2 },
        { start: 3, end: 4 },
        { start: 5, end: 6 },
      ],
    });
    // Count span occurrences
    const spans = html.match(/<span/g);
    expect(spans).toHaveLength(3);
  });

  it("escapes HTML entities in matched text", () => {
    const html = highlightMatches({
      testString: "<div>",
      ranges: [{ start: 0, end: 5 }],
    });
    expect(html).toContain("&lt;div&gt;");
    expect(html).not.toContain("<div>");
  });
});

describe("isRegexLike", () => {
  it("returns true for input with regex metacharacters", () => {
    expect(isRegexLike({ input: "\\d+" })).toBe(true);
    expect(isRegexLike({ input: "a.*b" })).toBe(true);
    expect(isRegexLike({ input: "foo|bar" })).toBe(true);
    expect(isRegexLike({ input: "[a-z]" })).toBe(true);
  });

  it("returns false for plain text without metacharacters", () => {
    expect(isRegexLike({ input: "hello world" })).toBe(false);
    expect(isRegexLike({ input: "simple" })).toBe(false);
  });
});

describe("REGEX_PRESETS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(REGEX_PRESETS)).toBe(true);
    expect(REGEX_PRESETS.length).toBeGreaterThan(0);
  });

  it("each preset has name, pattern, and flags", () => {
    for (const preset of REGEX_PRESETS) {
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("pattern");
      expect(preset).toHaveProperty("flags");
      expect(typeof preset.name).toBe("string");
      expect(typeof preset.pattern).toBe("string");
    }
  });

  it("all preset patterns are valid regex", () => {
    for (const preset of REGEX_PRESETS) {
      const result = validatePattern({ pattern: preset.pattern });
      expect(result.valid).toBe(true);
    }
  });
});
