import { describe, it, expect } from "bun:test";
import {
  detectTimestampFormat,
  parseTimestamp,
  getRelativeTime,
  formatAllTimestamps,
  extractTimestampFromLog,
} from "./timestamp.utils";

describe("detectTimestampFormat", () => {
  it("detects Unix seconds (10 digits)", () => {
    expect(detectTimestampFormat({ input: "1700000000" })).toBe("unix_s");
  });

  it("detects Unix seconds (9 digits)", () => {
    expect(detectTimestampFormat({ input: "999999999" })).toBe("unix_s");
  });

  it("detects Unix milliseconds (13 digits)", () => {
    expect(detectTimestampFormat({ input: "1700000000000" })).toBe("unix_ms");
  });

  it("detects Unix milliseconds (12 digits)", () => {
    expect(detectTimestampFormat({ input: "170000000000" })).toBe("unix_ms");
  });

  it("detects ISO 8601 with T separator", () => {
    expect(detectTimestampFormat({ input: "2024-01-15T10:30:00Z" })).toBe("iso8601");
  });

  it("detects ISO 8601 with space separator", () => {
    expect(detectTimestampFormat({ input: "2024-01-15 10:30:00" })).toBe("iso8601");
  });

  it("returns unknown for unrecognized input", () => {
    expect(detectTimestampFormat({ input: "not a timestamp" })).toBe("unknown");
  });

  it("returns unknown for empty string", () => {
    expect(detectTimestampFormat({ input: "" })).toBe("unknown");
  });

  it("trims whitespace", () => {
    expect(detectTimestampFormat({ input: "  1700000000  " })).toBe("unix_s");
  });
});

describe("parseTimestamp", () => {
  it("parses Unix seconds correctly", () => {
    const result = parseTimestamp({ input: "1700000000" });
    expect("date" in result).toBe(true);
    if (!("date" in result)) return;
    expect(result.format).toBe("unix_s");
    expect(result.date.getTime()).toBe(1700000000 * 1000);
  });

  it("parses Unix milliseconds correctly", () => {
    const result = parseTimestamp({ input: "1700000000000" });
    expect("date" in result).toBe(true);
    if (!("date" in result)) return;
    expect(result.format).toBe("unix_ms");
    expect(result.date.getTime()).toBe(1700000000000);
  });

  it("parses ISO 8601 correctly", () => {
    const result = parseTimestamp({ input: "2024-01-15T10:30:00Z" });
    expect("date" in result).toBe(true);
    if (!("date" in result)) return;
    expect(result.format).toBe("iso8601");
    expect(result.date.toISOString()).toBe("2024-01-15T10:30:00.000Z");
  });

  it("returns error for empty input", () => {
    const result = parseTimestamp({ input: "" });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toBe("Empty input");
  });

  it("returns error for whitespace-only input", () => {
    const result = parseTimestamp({ input: "   " });
    expect("error" in result).toBe(true);
  });

  it("returns error for unparseable input", () => {
    const result = parseTimestamp({ input: "not-a-date-at-all-xyz" });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toBe("Could not parse timestamp");
  });

  it("falls back to Date.parse for common date strings", () => {
    const result = parseTimestamp({ input: "January 1, 2024" });
    expect("date" in result).toBe(true);
    if (!("date" in result)) return;
    expect(result.format).toBe("unknown");
    expect(result.date.getFullYear()).toBe(2024);
  });
});

describe("getRelativeTime", () => {
  it("returns 'just now' for dates within 5 seconds of now", () => {
    const now = new Date();
    expect(getRelativeTime({ date: now })).toBe("just now");
  });

  it("returns seconds ago for recent past", () => {
    const date = new Date(Date.now() - 30_000);
    const result = getRelativeTime({ date });
    expect(result).toContain("second");
    expect(result).toContain("ago");
  });

  it("returns minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60_000);
    const result = getRelativeTime({ date });
    expect(result).toContain("minute");
    expect(result).toContain("ago");
  });

  it("returns hours ago", () => {
    const date = new Date(Date.now() - 3 * 3600_000);
    const result = getRelativeTime({ date });
    expect(result).toContain("hour");
    expect(result).toContain("ago");
  });

  it("returns days ago", () => {
    const date = new Date(Date.now() - 7 * 86400_000);
    const result = getRelativeTime({ date });
    expect(result).toContain("day");
    expect(result).toContain("ago");
  });

  it("returns 'in X' for future dates", () => {
    const date = new Date(Date.now() + 3 * 3600_000);
    const result = getRelativeTime({ date });
    expect(result).toContain("in ");
    expect(result).toContain("hour");
  });

  it("uses singular form for 1 unit", () => {
    const date = new Date(Date.now() - 60_000);
    const result = getRelativeTime({ date });
    expect(result).toBe("1 minute ago");
  });

  it("uses plural form for multiple units", () => {
    const date = new Date(Date.now() - 2 * 60_000);
    const result = getRelativeTime({ date });
    expect(result).toBe("2 minutes ago");
  });
});

describe("formatAllTimestamps", () => {
  const fixedDate = new Date("2024-06-15T12:00:00.000Z");

  it("returns unixSeconds", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(result.unixSeconds).toBe(Math.floor(fixedDate.getTime() / 1000));
  });

  it("returns unixMs", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(result.unixMs).toBe(fixedDate.getTime());
  });

  it("returns iso8601", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(result.iso8601).toBe("2024-06-15T12:00:00.000Z");
  });

  it("returns utc string", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(result.utc).toBe(fixedDate.toUTCString());
  });

  it("returns local string", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(result.local).toBe(fixedDate.toLocaleString());
  });

  it("returns a relative time string", () => {
    const result = formatAllTimestamps({ date: fixedDate });
    expect(typeof result.relative).toBe("string");
    // The date is in the past, so it should contain "ago"
    expect(result.relative).toContain("ago");
  });
});

describe("extractTimestampFromLog", () => {
  it("extracts ISO 8601 timestamps from log lines", () => {
    const log = '[2024-01-15T10:30:00Z] INFO: Server started';
    expect(extractTimestampFromLog({ input: log })).toBe("2024-01-15T10:30:00Z");
  });

  it("extracts ISO 8601 with milliseconds and timezone offset", () => {
    const log = "2024-01-15T10:30:00.123+05:30 ERROR: something failed";
    expect(extractTimestampFromLog({ input: log })).toBe("2024-01-15T10:30:00.123+05:30");
  });

  it("extracts Unix timestamps from log lines", () => {
    const log = "event_time=1700000000 action=login";
    expect(extractTimestampFromLog({ input: log })).toBe("1700000000");
  });

  it("extracts Unix ms timestamps", () => {
    const log = "ts:1700000000000 level=debug";
    expect(extractTimestampFromLog({ input: log })).toBe("1700000000000");
  });

  it("extracts Apache-style timestamps", () => {
    const log = '127.0.0.1 - - [15/Jan/2024:10:30:00 +0000] "GET / HTTP/1.1"';
    expect(extractTimestampFromLog({ input: log })).toBe("15/Jan/2024:10:30:00");
  });

  it("extracts syslog-style timestamps", () => {
    const log = "Jan 15 10:30:00 server sshd[1234]: connection from 10.0.0.1";
    expect(extractTimestampFromLog({ input: log })).toBe("Jan 15 10:30:00");
  });

  it("returns null when no timestamp is found", () => {
    expect(extractTimestampFromLog({ input: "no timestamp here" })).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractTimestampFromLog({ input: "" })).toBeNull();
  });
});
