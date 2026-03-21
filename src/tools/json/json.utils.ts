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
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(?:\\.|[^"\\])*")\s*:/g,
      '<span class="text-gray-900 dark:text-gray-100 font-semibold">$1</span>:'
    )
    .replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      ': <span class="text-green-600 dark:text-green-400">$1</span>'
    )
    .replace(
      /:\s*(\d+\.?\d*)/g,
      ': <span class="text-blue-600 dark:text-blue-400">$1</span>'
    )
    .replace(
      /:\s*(true|false)/g,
      ': <span class="text-orange-600 dark:text-orange-400">$1</span>'
    )
    .replace(
      /:\s*(null)/g,
      ': <span class="text-gray-400 dark:text-gray-500">$1</span>'
    );
}
