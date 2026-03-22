import { useMemo } from "react";
import { Button } from "../../components/ui";
import { useToolState } from "../../hooks/useToolState";
import {
  testRegex,
  getMatchRanges,
  highlightMatches,
  validatePattern,
  REGEX_PRESETS,
} from "./regex.utils";

type ToolProps = { clipboardText: string; clipboardMatch: boolean };

const ALL_FLAGS = ["g", "i", "m", "s", "u"] as const;

export function RegexTester({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const { state, update } = useToolState({
    toolId: "regex",
    initial: { pattern: "", flags: "g", testString: clipboardMatch ? clipboardText : "" },
  });

  const toggleFlag = (f: string): void => {
    update({ flags: state.flags.includes(f) ? state.flags.replace(f, "") : state.flags + f });
  };

  const applyPreset = (p: (typeof REGEX_PRESETS)[number]): void => {
    update({ pattern: p.pattern, flags: p.flags });
  };

  const validation = useMemo(() => validatePattern({ pattern: state.pattern }), [state.pattern]);
  const result = useMemo(
    () => (state.pattern ? testRegex({ pattern: state.pattern, flags: state.flags, testString: state.testString }) : null),
    [state.pattern, state.flags, state.testString],
  );
  const ranges = useMemo(
    () => (state.pattern ? getMatchRanges({ pattern: state.pattern, flags: state.flags, testString: state.testString }) : []),
    [state.pattern, state.flags, state.testString],
  );
  const highlighted = useMemo(
    () => highlightMatches({ testString: state.testString, ranges }),
    [state.testString, ranges],
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
          <Button key={p.name} variant="small" onClick={() => applyPreset(p)}>{p.name}</Button>
        ))}
      </div>

      {/* Pattern + flags */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <span className="text-gray-400 font-mono text-sm">/</span>
        <input
          value={state.pattern}
          onChange={(e) => update({ pattern: e.target.value })}
          placeholder="Enter a regex pattern..."
          className="flex-1 bg-transparent text-sm font-mono outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          spellCheck={false}
        />
        <span className="text-gray-400 font-mono text-sm">/</span>
        <div className="flex gap-1">
          {ALL_FLAGS.map((f) => (
            <Button key={f} variant="small" active={state.flags.includes(f)} onClick={() => toggleFlag(f)} className="font-mono font-semibold">{f}</Button>
          ))}
        </div>
      </div>

      {!validation.valid && state.pattern && (
        <div className="px-3 py-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-500/10">
          {validation.error}
        </div>
      )}

      {/* Test string + highlighted output */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        <textarea
          value={state.testString}
          onChange={(e) => update({ testString: e.target.value })}
          placeholder="Paste text to test against the pattern..."
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
