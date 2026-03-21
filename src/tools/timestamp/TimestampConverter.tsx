import { useState, useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import {
  parseTimestamp,
  formatAllTimestamps,
  extractTimestampFromLog,
  detectTimestampFormat,
} from "./timestamp.utils";
import type { ToolProps } from "../registry";
import type { AllFormats, TimestampFormat } from "./timestamp.utils";

const FORMAT_LABELS: Record<TimestampFormat, string> = {
  unix_s: "Unix (seconds)",
  unix_ms: "Unix (milliseconds)",
  iso8601: "ISO 8601",
  unknown: "Date string",
} as const;

function OutputRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-24 shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-mono text-gray-800 dark:text-gray-200 break-all">
        {value}
      </span>
    </div>
  );
}

export function TimestampConverter({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");

  const result = useMemo((): { formats: AllFormats; detected: TimestampFormat } | { error: string } | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Smart paste: try to extract timestamp from log line
    let target = trimmed;
    const detected = detectTimestampFormat({ input: trimmed });
    if (detected === "unknown") {
      const extracted = extractTimestampFromLog({ input: trimmed });
      if (extracted) target = extracted;
    }

    const parsed = parseTimestamp({ input: target });
    if ("error" in parsed) return { error: parsed.error };
    return { formats: formatAllTimestamps({ date: parsed.date }), detected: parsed.format };
  }, [input]);

  const outputValue = result && "formats" in result
    ? Object.values(result.formats).map(String).join("\n")
    : "";

  const meta = result && "detected" in result
    ? `Detected: ${FORMAT_LABELS[result.detected]}`
    : undefined;

  const error = result && "error" in result ? result.error : undefined;

  const handleNow = (): void => {
    setInput(String(Date.now()));
  };

  const handleConvert = (): void => {
    /* result is computed reactively via useMemo — this is a no-op trigger kept for UX clarity */
    if (!input.trim()) setInput(String(Date.now()));
  };

  const outputElement = result && "formats" in result ? (
    <div className="flex flex-col gap-0">
      <OutputRow label="Unix (s)" value={String(result.formats.unixSeconds)} />
      <OutputRow label="Unix (ms)" value={String(result.formats.unixMs)} />
      <OutputRow label="ISO 8601" value={result.formats.iso8601} />
      <OutputRow label="UTC" value={result.formats.utc} />
      <OutputRow label="Local" value={result.formats.local} />
      <OutputRow label="Relative" value={result.formats.relative} />
    </div>
  ) : undefined;

  return (
    <ToolPane
      inputValue={input}
      onInputChange={setInput}
      outputValue={outputValue}
      outputElement={outputElement}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      placeholder="1711234567 or 2024-03-23T15:30:00Z"
      actions={[
        { label: "Convert", onClick: handleConvert },
        { label: "Now", onClick: handleNow },
      ]}
      meta={meta}
      error={error}
    />
  );
}
