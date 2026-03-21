import { describe, it, expect } from "bun:test";
import {
  detectColorFormat,
  parseColor,
  toHex,
  toRgb,
  toHsl,
  getAllFormats,
  getContrastRatio,
  getWcagResult,
} from "./color.utils";

describe("detectColorFormat", () => {
  it("detects hex with 3 digits", () => {
    expect(detectColorFormat({ input: "#f00" })).toBe("hex");
  });

  it("detects hex with 6 digits", () => {
    expect(detectColorFormat({ input: "#ff0000" })).toBe("hex");
  });

  it("detects hex with 8 digits (alpha)", () => {
    expect(detectColorFormat({ input: "#ff000080" })).toBe("hex");
  });

  it("detects rgb()", () => {
    expect(detectColorFormat({ input: "rgb(255, 0, 0)" })).toBe("rgb");
  });

  it("detects rgba()", () => {
    expect(detectColorFormat({ input: "rgba(255, 0, 0, 0.5)" })).toBe("rgb");
  });

  it("detects hsl()", () => {
    expect(detectColorFormat({ input: "hsl(0, 100%, 50%)" })).toBe("hsl");
  });

  it("detects hsla()", () => {
    expect(detectColorFormat({ input: "hsla(0, 100%, 50%, 0.5)" })).toBe("hsl");
  });

  it("returns unknown for invalid input", () => {
    expect(detectColorFormat({ input: "red" })).toBe("unknown");
  });

  it("returns unknown for empty input", () => {
    expect(detectColorFormat({ input: "" })).toBe("unknown");
  });
});

describe("parseColor", () => {
  it("parses #RGB shorthand", () => {
    const result = parseColor({ input: "#f00" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBe(1);
  });

  it("parses #RRGGBB", () => {
    const result = parseColor({ input: "#00ff00" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
  });

  it("parses #RRGGBBAA", () => {
    const result = parseColor({ input: "#ff000080" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBeCloseTo(0.5, 1);
  });

  it("parses rgb()", () => {
    const result = parseColor({ input: "rgb(128, 64, 32)" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(128);
    expect(result.g).toBe(64);
    expect(result.b).toBe(32);
    expect(result.a).toBe(1);
  });

  it("parses rgba()", () => {
    const result = parseColor({ input: "rgba(255, 128, 0, 0.75)" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(255);
    expect(result.g).toBe(128);
    expect(result.b).toBe(0);
    expect(result.a).toBe(0.75);
  });

  it("parses hsl()", () => {
    const result = parseColor({ input: "hsl(0, 100%, 50%)" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it("parses hsla()", () => {
    const result = parseColor({ input: "hsla(120, 100%, 50%, 0.5)" });
    expect(result.isValid).toBe(true);
    if (!result.isValid) return;
    expect(result.r).toBe(0);
    expect(result.g).toBe(255);
    expect(result.b).toBe(0);
    expect(result.a).toBe(0.5);
  });

  it("returns error for empty input", () => {
    const result = parseColor({ input: "" });
    expect(result.isValid).toBe(false);
  });

  it("returns error for unrecognized format", () => {
    const result = parseColor({ input: "notacolor" });
    expect(result.isValid).toBe(false);
  });

  it("returns error for invalid hex characters", () => {
    const result = parseColor({ input: "#gggggg" });
    expect(result.isValid).toBe(false);
  });

  it("returns error for invalid hex length", () => {
    const result = parseColor({ input: "#12345" });
    expect(result.isValid).toBe(false);
  });
});

describe("toHex", () => {
  it("converts RGBA to hex without alpha when a=1", () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
  });

  it("includes alpha channel when a < 1", () => {
    const hex = toHex({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(hex).toMatch(/^#ff0000[0-9a-f]{2}$/);
  });

  it("pads single-digit hex values", () => {
    expect(toHex({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000");
  });
});

describe("toRgb", () => {
  it("converts to rgb() when a=1", () => {
    expect(toRgb({ r: 255, g: 128, b: 0, a: 1 })).toBe("rgb(255, 128, 0)");
  });

  it("converts to rgba() when a < 1", () => {
    expect(toRgb({ r: 255, g: 128, b: 0, a: 0.5 })).toBe(
      "rgba(255, 128, 0, 0.5)"
    );
  });
});

describe("toHsl", () => {
  it("converts pure red to hsl", () => {
    const hsl = toHsl({ r: 255, g: 0, b: 0, a: 1 });
    expect(hsl).toContain("hsl(");
    expect(hsl).toContain("0,");
    expect(hsl).toContain("100%");
    expect(hsl).toContain("50%");
  });

  it("converts to hsla() when a < 1", () => {
    const hsl = toHsl({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(hsl).toContain("hsla(");
    expect(hsl).toContain("0.5");
  });
});

describe("getAllFormats", () => {
  it("returns hex, rgb, and hsl keys", () => {
    const formats = getAllFormats({ r: 255, g: 0, b: 0, a: 1 });
    expect(formats).toHaveProperty("hex");
    expect(formats).toHaveProperty("rgb");
    expect(formats).toHaveProperty("hsl");
    expect(formats.hex).toBe("#ff0000");
    expect(formats.rgb).toBe("rgb(255, 0, 0)");
  });
});

describe("getContrastRatio", () => {
  it("returns 21 for black on white", () => {
    const ratio = getContrastRatio({
      fg: { r: 0, g: 0, b: 0 },
      bg: { r: 255, g: 255, b: 255 },
    });
    expect(ratio).toBe(21);
  });

  it("returns 1 for same color", () => {
    const ratio = getContrastRatio({
      fg: { r: 128, g: 128, b: 128 },
      bg: { r: 128, g: 128, b: 128 },
    });
    expect(ratio).toBe(1);
  });

  it("returns a value between 1 and 21 for arbitrary colors", () => {
    const ratio = getContrastRatio({
      fg: { r: 50, g: 50, b: 200 },
      bg: { r: 255, g: 255, b: 200 },
    });
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(21);
  });
});

describe("getWcagResult", () => {
  it("passes all levels for ratio >= 7", () => {
    const result = getWcagResult({ ratio: 7.5 });
    expect(result.aa).toBe(true);
    expect(result.aaa).toBe(true);
    expect(result.aaLarge).toBe(true);
    expect(result.aaaLarge).toBe(true);
  });

  it("passes AA but not AAA for ratio between 4.5 and 7", () => {
    const result = getWcagResult({ ratio: 5 });
    expect(result.aa).toBe(true);
    expect(result.aaa).toBe(false);
    expect(result.aaLarge).toBe(true);
    expect(result.aaaLarge).toBe(true);
  });

  it("passes only large text levels for ratio between 3 and 4.5", () => {
    const result = getWcagResult({ ratio: 3.5 });
    expect(result.aa).toBe(false);
    expect(result.aaa).toBe(false);
    expect(result.aaLarge).toBe(true);
    expect(result.aaaLarge).toBe(false);
  });

  it("fails all levels for ratio below 3", () => {
    const result = getWcagResult({ ratio: 2 });
    expect(result.aa).toBe(false);
    expect(result.aaa).toBe(false);
    expect(result.aaLarge).toBe(false);
    expect(result.aaaLarge).toBe(false);
  });
});
