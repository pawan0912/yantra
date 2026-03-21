export function formatJson({ input, indent = 2 }: { input: string; indent?: number }): string {
  return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson({ input }: { input: string }): string {
  return JSON.stringify(JSON.parse(input));
}

export function validateJson({ input }: { input: string }): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

type JsonMeta = {
  keyCount: number;
  maxDepth: number;
  arrayLengths: Record<string, number>;
};

export function getJsonMeta({ input }: { input: string }): JsonMeta {
  const parsed = JSON.parse(input);
  let keyCount = 0;
  let maxDepth = 0;
  const arrayLengths: Record<string, number> = {};

  function walk(value: unknown, depth: number, path: string): void {
    if (depth > maxDepth) maxDepth = depth;
    if (Array.isArray(value)) {
      arrayLengths[path || "root"] = value.length;
      value.forEach((item, i) => walk(item, depth + 1, `${path}[${i}]`));
    } else if (value !== null && typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      keyCount += keys.length;
      keys.forEach((key) =>
        walk((value as Record<string, unknown>)[key], depth + 1, path ? `${path}.${key}` : key)
      );
    }
  }

  walk(parsed, 0, "");
  return { keyCount, maxDepth, arrayLengths };
}

export function highlightJson({ json }: { json: string }): string {
  // Tokenize and highlight in a single pass to avoid regex interference
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Single-pass regex that matches JSON tokens in order of priority
  return escaped.replace(
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b|\b(true|false)\b|\b(null)\b/g,
    (match, key?: string, str?: string, num?: string, bool?: string, nil?: string) => {
      if (key) return `<span style="font-weight:600">${key}</span>:`;
      if (str) return `<span style="color:#16a34a">${str}</span>`;
      if (num) return `<span style="color:#2563eb">${num}</span>`;
      if (bool) return `<span style="color:#ea580c">${bool}</span>`;
      if (nil) return `<span style="color:#9ca3af">${nil}</span>`;
      return match;
    }
  );
}
