import { useState, useEffect, useRef, useMemo } from "react";
import { tools } from "../../tools/registry";

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

  const filtered = useMemo(() => {
    if (!query.trim()) return tools;
    return tools.filter(
      (tool) =>
        fuzzyMatch(query, tool.name) ||
        fuzzyMatch(query, tool.description) ||
        tool.tags.some((tag) => fuzzyMatch(query, tag))
    );
  }, [query]);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div
        className="w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search tools..."
          className="w-full px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-gray-100
                     border-b border-gray-200 dark:border-gray-700 focus:outline-none
                     placeholder-gray-400 dark:placeholder-gray-600"
        />
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((tool, i) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelect(tool.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="w-6 text-center text-xs">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {tool.description}
                </div>
              </div>
              <kbd className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                ⌘{tool.shortcut}
              </kbd>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No tools found</div>
          )}
        </div>
      </div>
    </div>
  );
}
