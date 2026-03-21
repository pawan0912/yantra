export type DiffLine = {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
};

function lcs({ oldLines, newLines }: { oldLines: string[]; newLines: string[] }): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

export function computeDiff({ oldText, newText }: { oldText: string; newText: string }): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const dp = lcs({ oldLines, newLines });
  const result: DiffLine[] = [];

  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({ type: "unchanged", content: oldLines[i - 1], oldLineNum: i, newLineNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", content: newLines[j - 1], newLineNum: j });
      j--;
    } else {
      result.push({ type: "removed", content: oldLines[i - 1], oldLineNum: i });
      i--;
    }
  }

  return result.reverse();
}

export function formatUnifiedDiff({ lines }: { lines: DiffLine[] }): string {
  const prefixMap = { added: "+", removed: "-", unchanged: " " } as const;
  return lines.map((line) => `${prefixMap[line.type]}${line.content}`).join("\n");
}

export function isJsonLike({ input }: { input: string }): boolean {
  const trimmed = input.trim();
  return (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
}

export function tryFormatJson({ input }: { input: string }): string {
  try {
    return JSON.stringify(JSON.parse(input), null, 2);
  } catch {
    return input;
  }
}

export function getDiffStats({ lines }: { lines: DiffLine[] }): {
  added: number;
  removed: number;
  unchanged: number;
} {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const line of lines) {
    if (line.type === "added") added++;
    else if (line.type === "removed") removed++;
    else unchanged++;
  }

  return { added, removed, unchanged };
}
