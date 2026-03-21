type ColorRgba = { r: number; g: number; b: number; a: number };
type ParseResult =
  | (ColorRgba & { isValid: true })
  | { isValid: false; error: string };
type ColorFormat = "hex" | "rgb" | "hsl" | "unknown";
type WcagResult = { aa: boolean; aaa: boolean; aaLarge: boolean; aaaLarge: boolean };

export function detectColorFormat({ input }: { input: string }): ColorFormat {
  const s = input.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(s)) return "hex";
  if (/^rgba?\s*\(/i.test(s)) return "rgb";
  if (/^hsla?\s*\(/i.test(s)) return "hsl";
  return "unknown";
}

function clamp({ value, min, max }: { value: number; min: number; max: number }): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex({ input }: { input: string }): ParseResult {
  const hex = input.trim().replace(/^#/, "");
  let r: number, g: number, b: number, a = 1;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return { isValid: false, error: "Invalid hex length" };
  }

  if ([r, g, b].some((v) => isNaN(v))) {
    return { isValid: false, error: "Invalid hex characters" };
  }
  return { r, g, b, a: Math.round(a * 100) / 100, isValid: true };
}

function parseRgb({ input }: { input: string }): ParseResult {
  const match = input.trim().match(
    /^rgba?\s*\(\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  );
  if (!match) return { isValid: false, error: "Invalid rgb() syntax" };

  const r = clamp({ value: Math.round(Number(match[1])), min: 0, max: 255 });
  const g = clamp({ value: Math.round(Number(match[2])), min: 0, max: 255 });
  const b = clamp({ value: Math.round(Number(match[3])), min: 0, max: 255 });
  const a = match[4] !== undefined ? clamp({ value: Number(match[4]), min: 0, max: 1 }) : 1;

  return { r, g, b, a, isValid: true };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let rp = 0, gp = 0, bp = 0;

  if (h < 60) { rp = c; gp = x; }
  else if (h < 120) { rp = x; gp = c; }
  else if (h < 180) { gp = c; bp = x; }
  else if (h < 240) { gp = x; bp = c; }
  else if (h < 300) { rp = c; bp = x; }
  else { rp = x; bp = c; }

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function parseHsl({ input }: { input: string }): ParseResult {
  const match = input.trim().match(
    /^hsla?\s*\(\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)%\s*,\s*(\d+\.?\d*)%(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  );
  if (!match) return { isValid: false, error: "Invalid hsl() syntax" };

  const h = ((Number(match[1]) % 360) + 360) % 360;
  const s = clamp({ value: Number(match[2]), min: 0, max: 100 });
  const l = clamp({ value: Number(match[3]), min: 0, max: 100 });
  const a = match[4] !== undefined ? clamp({ value: Number(match[4]), min: 0, max: 1 }) : 1;
  const { r, g, b } = hslToRgb({ h, s, l });

  return { r, g, b, a, isValid: true };
}

export function parseColor({ input }: { input: string }): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { isValid: false, error: "Empty input" };

  const format = detectColorFormat({ input: trimmed });
  switch (format) {
    case "hex": return parseHex({ input: trimmed });
    case "rgb": return parseRgb({ input: trimmed });
    case "hsl": return parseHsl({ input: trimmed });
    default: return { isValid: false, error: "Unrecognized color format" };
  }
}

export function toHex({ r, g, b, a }: ColorRgba): string {
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  if (a < 1) {
    return `${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
  }
  return hex;
}

export function toRgb({ r, g, b, a }: ColorRgba): string {
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function toHsl({ r, g, b, a }: ColorRgba): string {
  const { h, s, l } = rgbToHsl({ r, g, b });
  if (a < 1) return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getAllFormats({ r, g, b, a }: ColorRgba): { hex: string; rgb: string; hsl: string } {
  return {
    hex: toHex({ r, g, b, a }),
    rgb: toRgb({ r, g, b, a }),
    hsl: toHsl({ r, g, b, a }),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio({ fg, bg }: { fg: { r: number; g: number; b: number }; bg: { r: number; g: number; b: number } }): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function getWcagResult({ ratio }: { ratio: number }): WcagResult {
  return {
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}
