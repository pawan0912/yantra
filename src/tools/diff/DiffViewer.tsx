import { useState, useMemo } from "react";
import { CopyButton } from "../../components/layout/CopyButton";
import { computeDiff, getDiffStats, isJsonLike, tryFormatJson, formatUnifiedDiff } from "./diff.utils";
import type { DiffLine } from "./diff.utils";
import type { ToolProps } from "../registry";

function DiffOutput({ lines }: { lines: DiffLine[] }): React.ReactElement {
  return (
    <pre className="text-sm font-mono overflow-auto max-h-64 p-3 rounded-lg bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
      {lines.map((line, i) => {
        const bg =
          line.type === "added" ? "rgba(34,197,94,0.15)" :
          line.type === "removed" ? "rgba(239,68,68,0.15)" : "transparent";
        const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const oldNum = line.oldLineNum?.toString().padStart(3, " ") ?? "   ";
        const newNum = line.newLineNum?.toString().padStart(3, " ") ?? "   ";
        return (
          <div key={i} style={{ backgroundColor: bg }}>
            <span className="text-black/30 dark:text-white/30 select-none">{oldNum} {newNum} </span>
            <span className="text-black/40 dark:text-white/40 select-none">{prefix}</span>
            {line.content}
          </div>
        );
      })}
    </pre>
  );
}

export function DiffViewer({ clipboardText }: ToolProps): React.ReactElement {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState(clipboardText);
  const [lines, setLines] = useState<DiffLine[] | null>(null);

  const stats = useMemo(() => (lines ? getDiffStats({ lines }) : null), [lines]);
  const unified = useMemo(() => (lines ? formatUnifiedDiff({ lines }) : ""), [lines]);

  const handleCompare = (): void => {
    let a = oldText;
    let b = newText;
    if (isJsonLike({ input: a }) && isJsonLike({ input: b })) {
      a = tryFormatJson({ input: a });
      b = tryFormatJson({ input: b });
    }
    setLines(computeDiff({ oldText: a, newText: b }));
  };

  return (
    <div className="flex flex-col gap-3 h-full p-4 overflow-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={handleCompare}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
        >
          Compare
        </button>
        <div className="flex items-center gap-3 text-xs text-black/50 dark:text-white/50">
          {stats && (
            <>
              <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
              <span className="text-red-500 dark:text-red-400">-{stats.removed}</span>
              <span>~{stats.unchanged}</span>
            </>
          )}
          {unified && <CopyButton text={unified} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 min-h-[120px]">
        <textarea
          value={oldText}
          onChange={(e) => setOldText(e.target.value)}
          placeholder="Paste original text here..."
          className="w-full resize-none rounded-lg bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
          rows={6}
        />
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Paste modified text here..."
          className="w-full resize-none rounded-lg bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
          rows={6}
        />
      </div>

      {lines && lines.length > 0 && <DiffOutput lines={lines} />}
    </div>
  );
}
