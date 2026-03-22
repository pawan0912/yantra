import { Send, Loader2 } from "lucide-react";
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
};

export function UrlBar({
  method, url, loading, onMethodChange, onUrlChange, onSend,
}: UrlBarProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
      {/* Method selector */}
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        className={cn(
          "text-[11px] font-bold rounded-md px-2 py-1.5 cursor-pointer appearance-none text-center w-[72px]",
          "bg-gray-100/80 dark:bg-white/[0.06] border-none",
          "focus:outline-none focus:ring-1 focus:ring-blue-500/30",
          "transition-colors duration-150",
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
        className="flex-1 text-[13px] bg-gray-50/80 dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 px-3 py-1.5
                   rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/30
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
    </div>
  );
}
