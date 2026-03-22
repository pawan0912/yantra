import { Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { METHOD_COLORS, getStatusColor } from "../api-playground.utils";
import type { HistoryEntry } from "../api-playground.utils";
import { Button } from "../../../components/ui";

type HistoryPanelProps = {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
};

function formatTime({ timestamp }: { timestamp: number }): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function extractPath({ url }: { url: string }): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps): React.ReactElement {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-400 dark:text-gray-500">No request history yet</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {history.length} request{history.length !== 1 ? "s" : ""}
        </span>
        <Button variant="secondary" onClick={onClear}>
          <Trash2 className="w-3 h-3 mr-1" strokeWidth={1.5} />
          Clear
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-gray-200/30 dark:border-white/[0.03]
                       hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
          >
            <span className={cn("text-[10px] font-bold w-12 flex-shrink-0", METHOD_COLORS[entry.request.method])}>
              {entry.request.method}
            </span>
            <span className="flex-1 text-[12px] font-mono text-gray-700 dark:text-gray-300 truncate">
              {extractPath({ url: entry.request.url })}
            </span>
            <span className={cn("text-[11px] font-bold flex-shrink-0", getStatusColor({ status: entry.response.status }))}>
              {entry.response.status}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 w-12 text-right">
              {entry.response.timeMs}ms
            </span>
            <span className="text-[10px] text-gray-400/60 dark:text-gray-500/60 flex-shrink-0 w-14 text-right">
              {formatTime({ timestamp: entry.timestamp })}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
