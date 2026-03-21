import { useState, useMemo } from "react";
import {
  testRegex,
  getMatchRanges,
  highlightMatches,
  validatePattern,
  REGEX_PRESETS,
} from "./regex.utils";

type ToolProps = { clipboardText: string; clipboardMatch: boolean };

const ALL_FLAGS = ["g", "i", "m", "s", "u"] as const;

function FlagToggle({
  flag,
  active,
  onToggle,
}: {
  flag: string;
  active: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
        active
          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
          : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
      }`}
    >
      {flag}
    </button>
  );
}

export function RegexTester({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState(clipboardMatch ? clipboardText : "");

  const toggleFlag = (f: string): void => {
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, "") : prev + f));
  };

  const applyPreset = (p: (typeof REGEX_PRESETS)[number]): void => {
    setPattern(p.pattern);
    setFlags(p.flags);
  };

  const validation = useMemo(() => validatePattern({ pattern }), [pattern]);
  const result = useMemo(
    () => (pattern ? testRegex({ pattern, flags, testString }) : null),
    [pattern, flags, testString],
  );
  const ranges = useMemo(
    () => (pattern ? getMatchRanges({ pattern, flags, testString }) : []),
    [pattern, flags, testString],
  );
  const highlighted = useMemo(
    () => highlightMatches({ testString, ranges }),
    [testString, ranges],
  );

  const groups =
    result && result.isValid
      ? result.matches.filter((m) => m.groups).flatMap((m) => Object.entries(m.groups!))
      : [];

  return (
    <div className="flex flex-col h-full">
      {/* Presets bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-1">Presets</span>
        {REGEX_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className="px-2 py-0.5 rounded-md text-[11px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Pattern + flags */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <span className="text-gray-400 font-mono text-sm">/</span>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
          className="flex-1 bg-transparent text-sm font-mono outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          spellCheck={false}
        />
        <span className="text-gray-400 font-mono text-sm">/</span>
        <div className="flex gap-1">
          {ALL_FLAGS.map((f) => (
            <FlagToggle key={f} flag={f} active={flags.includes(f)} onToggle={() => toggleFlag(f)} />
          ))}
        </div>
      </div>

      {!validation.valid && pattern && (
        <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-500/10">
          {validation.error}
        </div>
      )}

      {/* Test string + highlighted output */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="Contact us at hello@example.com or support@test.org"
          className="p-3 bg-transparent text-sm font-mono resize-none outline-none border-r border-gray-200/60 dark:border-white/[0.06] text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          spellCheck={false}
        />
        <div
          className="p-3 text-sm font-mono whitespace-pre-wrap overflow-auto text-gray-800 dark:text-gray-200"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>

      {/* Meta bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-gray-200/60 dark:border-white/[0.06] text-[11px] text-gray-500 dark:text-gray-400">
        <span>
          {result && result.isValid
            ? `${result.matchCount} match${result.matchCount !== 1 ? "es" : ""}`
            : "No matches"}
        </span>
        {groups.length > 0 && (
          <span className="border-l border-gray-200 dark:border-white/10 pl-3">
            Groups: {groups.map(([k, v]) => `${k}="${v}"`).join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}
