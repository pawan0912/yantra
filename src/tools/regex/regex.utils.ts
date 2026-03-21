export type RegexMatch = {
  fullMatch: string;
  index: number;
  length: number;
  groups: Record<string, string> | null;
};

export type TestRegexResult =
  | { isValid: true; matches: RegexMatch[]; matchCount: number }
  | { isValid: false; error: string };

export type MatchRange = { start: number; end: number };

export const REGEX_PRESETS: Array<{ name: string; pattern: string; flags: string }> = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g" },
  { name: "UUID v4", pattern: "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", flags: "gi" },
  { name: "URL", pattern: "https?://[^\\s/$.?#].[^\\s]*", flags: "gi" },
  { name: "ISO Date", pattern: "\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2})?", flags: "g" },
  { name: "IP Address", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", flags: "g" },
];

export function validatePattern({ pattern }: { pattern: string }): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function testRegex({
  pattern,
  flags,
  testString,
}: {
  pattern: string;
  flags: string;
  testString: string;
}): TestRegexResult {
  if (!pattern) return { isValid: true, matches: [], matchCount: 0 };

  try {
    const re = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];

    if (flags.includes("g")) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(testString)) !== null) {
        matches.push({
          fullMatch: m[0],
          index: m.index,
          length: m[0].length,
          groups: m.groups ? { ...m.groups } : null,
        });
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = re.exec(testString);
      if (m) {
        matches.push({
          fullMatch: m[0],
          index: m.index,
          length: m[0].length,
          groups: m.groups ? { ...m.groups } : null,
        });
      }
    }

    return { isValid: true, matches, matchCount: matches.length };
  } catch (e) {
    return { isValid: false, error: (e as Error).message };
  }
}

export function getMatchRanges({
  pattern,
  flags,
  testString,
}: {
  pattern: string;
  flags: string;
  testString: string;
}): MatchRange[] {
  const result = testRegex({ pattern, flags, testString });
  if (!result.isValid) return [];
  return result.matches.map((m) => ({ start: m.index, end: m.index + m.length }));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MATCH_COLORS = [
  "background:rgba(59,130,246,0.25);border-bottom:2px solid rgba(59,130,246,0.6)",
  "background:rgba(234,179,8,0.25);border-bottom:2px solid rgba(234,179,8,0.6)",
];

export function highlightMatches({
  testString,
  ranges,
}: {
  testString: string;
  ranges: MatchRange[];
}): string {
  if (ranges.length === 0) return escapeHtml(testString);

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let html = "";
  let cursor = 0;

  sorted.forEach((range, i) => {
    if (range.start > cursor) {
      html += escapeHtml(testString.slice(cursor, range.start));
    }
    const style = MATCH_COLORS[i % MATCH_COLORS.length];
    html += `<span style="${style};border-radius:2px;padding:0 1px">${escapeHtml(testString.slice(range.start, range.end))}</span>`;
    cursor = range.end;
  });

  if (cursor < testString.length) {
    html += escapeHtml(testString.slice(cursor));
  }

  return html;
}

export function isRegexLike({ input }: { input: string }): boolean {
  return /[\\.*+?^${}()|[\]]/.test(input);
}
