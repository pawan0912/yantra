export type TimestampFormat = "unix_s" | "unix_ms" | "iso8601" | "unknown";

export type ParsedTimestamp =
  | { date: Date; format: TimestampFormat }
  | { error: string };

export type AllFormats = {
  unixSeconds: number;
  unixMs: number;
  iso8601: string;
  utc: string;
  local: string;
  relative: string;
};

export function detectTimestampFormat({ input }: { input: string }): TimestampFormat {
  const trimmed = input.trim();

  if (/^\d{9,10}$/.test(trimmed)) {
    return "unix_s";
  }

  if (/^\d{12,13}$/.test(trimmed)) {
    return "unix_ms";
  }

  if (/^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/.test(trimmed)) {
    return "iso8601";
  }

  return "unknown";
}

export function parseTimestamp({ input }: { input: string }): ParsedTimestamp {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Empty input" };
  }

  const format = detectTimestampFormat({ input: trimmed });

  if (format === "unix_s") {
    const date = new Date(Number(trimmed) * 1000);
    if (isNaN(date.getTime())) {
      return { error: "Invalid Unix timestamp (seconds)" };
    }
    return { date, format };
  }

  if (format === "unix_ms") {
    const date = new Date(Number(trimmed));
    if (isNaN(date.getTime())) {
      return { error: "Invalid Unix timestamp (milliseconds)" };
    }
    return { date, format };
  }

  if (format === "iso8601") {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return { error: "Invalid ISO 8601 date string" };
    }
    return { date, format };
  }

  // Fallback: try Date.parse for common date strings
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return { date, format: "unknown" };
  }

  return { error: "Could not parse timestamp" };
}

export function getRelativeTime({ date }: { date: Date }): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const label = (value: number, unit: string): string => {
    const plural = value === 1 ? unit : `${unit}s`;
    return isFuture ? `in ${value} ${plural}` : `${value} ${plural} ago`;
  };

  if (seconds < 5) return "just now";
  if (seconds < 60) return label(seconds, "second");
  if (minutes < 60) return label(minutes, "minute");
  if (hours < 24) return label(hours, "hour");
  if (days < 30) return label(days, "day");
  if (months < 12) return label(months, "month");
  return label(years, "year");
}

export function formatAllTimestamps({ date }: { date: Date }): AllFormats {
  return {
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso8601: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative: getRelativeTime({ date }),
  };
}

const LOG_TIMESTAMP_PATTERNS: RegExp[] = [
  /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/,
  /\b\d{10,13}\b/,
  /\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/,
  /\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/,
];

export function extractTimestampFromLog({ input }: { input: string }): string | null {
  for (const pattern of LOG_TIMESTAMP_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}
