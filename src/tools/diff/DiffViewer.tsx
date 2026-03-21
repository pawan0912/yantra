import { useState, useMemo } from "react";
import { CopyButton } from "../../components/layout/CopyButton";
import { Button, PaneHeader, Textarea } from "../../components/ui";
import { computeDiff, getDiffStats, isJsonLike, tryFormatJson, formatUnifiedDiff } from "./diff.utils";
import type { DiffLine } from "./diff.utils";
import type { ToolProps } from "../registry";

function DiffOutput({ lines }: { lines: DiffLine[] }): React.ReactElement {
  return (
    <pre className="text-[13px] font-mono leading-relaxed overflow-auto p-3">
      {lines.map((line, i) => {
        const bg =
          line.type === "added" ? "rgba(34,197,94,0.12)" :
          line.type === "removed" ? "rgba(239,68,68,0.12)" : "transparent";
        const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const oldNum = line.oldLineNum?.toString().padStart(3, " ") ?? "   ";
        const newNum = line.newLineNum?.toString().padStart(3, " ") ?? "   ";
        return (
          <div key={i} style={{ backgroundColor: bg }} className="px-1 -mx-1 rounded-sm">
            <span className="text-gray-400/50 dark:text-gray-500/50 select-none text-[11px]">{oldNum} {newNum} </span>
            <span className="text-gray-400/60 dark:text-gray-500/60 select-none">{prefix} </span>
            <span className="text-gray-800 dark:text-gray-200">{line.content}</span>
          </div>
        );
      })}
    </pre>
  );
}

export function DiffViewer(_props: ToolProps): React.ReactElement {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
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
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <Button variant="primary" onClick={handleCompare}>Compare</Button>
        {stats && (
          <div className="flex items-center gap-2 ml-2 text-xs">
            <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
            <span className="text-red-500 dark:text-red-400">-{stats.removed}</span>
            <span className="text-gray-500/80 dark:text-gray-400/80">~{stats.unchanged}</span>
          </div>
        )}
        <div className="ml-auto">
          <CopyButton text={unified} />
        </div>
      </div>

      {/* Two input panes */}
      <div className="flex min-h-0" style={{ height: "40%" }}>
        {/* Original */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200/60 dark:border-white/[0.06]">
          <PaneHeader label="Original" />
          <Textarea value={oldText} onChange={setOldText} placeholder="Paste original text here..." />
        </div>
        {/* Modified */}
        <div className="flex-1 flex flex-col min-w-0">
          <PaneHeader label="Modified" />
          <Textarea value={newText} onChange={setNewText} placeholder="Paste modified text here..." />
        </div>
      </div>

      {/* Diff output */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-200/60 dark:border-white/[0.06]">
        <PaneHeader label="Diff" />
        <div className="flex-1 overflow-auto">
          {lines && lines.length > 0 ? (
            <DiffOutput lines={lines} />
          ) : (
            <div className="flex items-center justify-center h-full text-[13px] text-gray-400/60 dark:text-gray-500/60">
              {lines ? "No differences found" : "Paste text in both panes and click Compare"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
