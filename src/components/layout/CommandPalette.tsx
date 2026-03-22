import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { tools } from "../../tools/registry";
import { cn } from "../../lib/utils";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (toolId: string) => void;
};

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function CommandPalette({ isOpen, onClose, onSelect }: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = (() => {
    if (!query.trim()) return tools;
    return tools.filter(
      (tool) =>
        fuzzyMatch(query, tool.name) ||
        fuzzyMatch(query, tool.description) ||
        tool.tags.some((tag) => fuzzyMatch(query, tag))
    );
  })();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex].id);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-100" />
      <div
        className="relative w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl
                   shadow-2xl shadow-black/20 border border-gray-200/50 dark:border-gray-700/50
                   overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..."
            className="w-full py-3 text-[13px] bg-transparent text-gray-900 dark:text-gray-100
                       focus:outline-none placeholder-gray-400/60 dark:placeholder-gray-500/60"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1 px-1">
          {filtered.map((tool, i) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelect(tool.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left text-[13px] rounded-lg",
                "transition-all duration-100 ease-out",
                i === selectedIndex
                  ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/[0.06]"
              )}
            >
              <tool.icon className="w-4 h-4 opacity-70 flex-shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.name}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {tool.description}
                </div>
              </div>
              <span className="text-[10px] text-gray-400/60 dark:text-gray-500/60 uppercase tracking-wider">{tool.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">
              No tools found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
