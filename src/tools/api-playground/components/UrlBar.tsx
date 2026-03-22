import { Send, Clock, Copy, Loader2 } from "lucide-react";
import { HTTP_METHODS, METHOD_COLORS } from "../api-playground.utils";
import type { HttpMethod } from "../api-playground.utils";
import { cn } from "../../../lib/utils";

type UrlBarProps = {
  method: HttpMethod;
  url: string;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCopyCurl: () => void;
  onToggleHistory: () => void;
  historyCount: number;
};

export function UrlBar({
  method, url, loading, onMethodChange, onUrlChange, onSend, onCopyCurl, onToggleHistory, historyCount,
}: UrlBarProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
      {/* Method selector */}
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        className={cn(
          "text-xs font-bold bg-transparent border border-gray-200/60 dark:border-white/[0.08] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30 cursor-pointer",
          METHOD_COLORS[method]
        )}
      >
        {HTTP_METHODS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* URL input */}
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 text-[13px] bg-transparent text-gray-900 dark:text-gray-100 px-2 py-1.5
                   border border-gray-200/60 dark:border-white/[0.08] rounded-md
                   focus:outline-none focus:ring-1 focus:ring-blue-500/30
                   placeholder-gray-400/60 dark:placeholder-gray-500/60 font-mono"
      />

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={loading || !url.trim()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
          "bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.97]",
          (loading || !url.trim()) && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Send className="w-3.5 h-3.5" strokeWidth={2} />
        )}
        Send
      </button>

      {/* Copy as cURL */}
      <button
        onClick={onCopyCurl}
        title="Copy as cURL"
        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                   hover:bg-gray-200/60 dark:hover:bg-white/[0.06] transition-colors"
      >
        <Copy className="w-3.5 h-3.5" strokeWidth={1.8} />
      </button>

      {/* History toggle */}
      <button
        onClick={onToggleHistory}
        title="Request history"
        className="relative p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                   hover:bg-gray-200/60 dark:hover:bg-white/[0.06] transition-colors"
      >
        <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
        {historyCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 text-[8px] text-white flex items-center justify-center font-bold">
            {historyCount > 9 ? "9+" : historyCount}
          </span>
        )}
      </button>
    </div>
  );
}
