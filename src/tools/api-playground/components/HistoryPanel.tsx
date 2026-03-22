import { cn } from "../../../lib/utils";
import { METHOD_COLORS, getStatusColor, formatBytes } from "../api-playground.utils";
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

function extractHost({ url }: { url: string }): string {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return "";
  }
}

function extractPath({ url }: { url: string }): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > 60 ? path.slice(0, 57) + "..." : path;
  } catch {
    return url;
  }
}

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps): React.ReactElement {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-400 dark:text-gray-500">No request history</div>
          <div className="text-[11px] text-gray-400/60 dark:text-gray-500/60 mt-1">
            Completed requests will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
          {history.length} request{history.length !== 1 ? "s" : ""}
        </span>
        <Button variant="secondary" onClick={onClear}>
          Clear all
        </Button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {history.map((entry) => {
          return (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              className="w-full text-left px-3 py-2.5 rounded-lg
                         hover:bg-gray-100/80 dark:hover:bg-white/[0.04]
                         active:bg-gray-200/60 dark:active:bg-white/[0.06]
                         transition-colors duration-100 group"
            >
              {/* Top row: method + path + status */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold w-[46px] flex-shrink-0 text-center py-0.5 rounded",
                  "bg-gray-100/80 dark:bg-white/[0.06]",
                  METHOD_COLORS[entry.request.method]
                )}>
                  {entry.request.method}
                </span>
                <span className="flex-1 text-[12px] font-mono text-gray-800 dark:text-gray-200 truncate">
                  {extractPath({ url: entry.request.url })}
                </span>
                <span className={cn(
                  "text-[11px] font-bold flex-shrink-0 tabular-nums",
                  getStatusColor({ status: entry.response.status })
                )}>
                  {entry.response.status}
                </span>
              </div>

              {/* Bottom row: host + time + size + relative time */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400/70 dark:text-gray-500/70 truncate flex-1">
                  {extractHost({ url: entry.request.url })}
                </span>
                <span className="text-[10px] text-gray-400/60 dark:text-gray-500/60 tabular-nums flex-shrink-0">
                  {entry.response.timeMs}ms
                </span>
                <span className="text-[10px] text-gray-400/60 dark:text-gray-500/60 flex-shrink-0">
                  {formatBytes({ bytes: entry.response.sizeBytes })}
                </span>
                <span className="text-[10px] text-gray-400/50 dark:text-gray-500/50 flex-shrink-0 w-[52px] text-right">
                  {formatTime({ timestamp: entry.timestamp })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
