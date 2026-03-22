import { useState, useEffect, useRef } from "react";
import { ClipboardPaste } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { cn } from "../../lib/utils";
import { Button, Textarea, PaneHeader, SegmentedControl } from "../ui";

type ToolAction = {
  label: string;
  onClick: () => void;
};

type ToolMode<T extends string = string> = {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
};

type ToolPaneProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  outputValue: string;
  outputElement?: React.ReactNode;
  actions?: ToolAction[];
  mode?: ToolMode;
  meta?: string;
  error?: string;
  placeholder?: string;
  clipboardText?: string;
  clipboardMatch?: boolean;
  sampleData?: string;
  onClear?: () => void;
};

function PasteIcon({ match, onClick }: { match: boolean; onClick: () => void }): React.ReactElement {
  return (
    <button
      onClick={onClick}
      title={match ? "Clipboard content matches — click to paste" : "Paste from clipboard"}
      className={cn(
        "p-1 rounded-md transition-all duration-200 ease-out",
        "text-gray-400/60 dark:text-gray-500/60 hover:text-gray-600 dark:hover:text-gray-300",
        "hover:bg-gray-200/60 dark:hover:bg-white/[0.06]",
        match && "animate-hint-pulse text-blue-500/80 dark:text-blue-400/80"
      )}
    >
      <ClipboardPaste className="w-3.5 h-3.5" strokeWidth={1.8} />
    </button>
  );
}


export function ToolPane({
  inputValue,
  onInputChange,
  outputValue,
  outputElement,
  actions = [],
  mode,
  meta,
  error,
  placeholder = "Paste or type here...",
  clipboardText = "",
  clipboardMatch = false,
  sampleData,
  onClear,
}: ToolPaneProps): React.ReactElement {
  const [pasted, setPasted] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    setPasted(false);
  }, [clipboardText]);

  const handlePaste = (): void => {
    if (clipboardText) {
      onInputChange(clipboardText);
      setPasted(true);
    }
  };

  const handleClear = (): void => {
    onInputChange("");
    onClear?.();
  };

  const handleSample = (): void => {
    if (sampleData) {
      onInputChange(sampleData);
    }
  };

  const hasContent = Boolean(inputValue || outputValue);
  const showPasteHint = clipboardText && !pasted && !inputValue;

  const onMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    dragging.current = true;

    const onMouseMove = (ev: MouseEvent): void => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(80, pct)));
    };

    const onMouseUp = (): void => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        {/* Sample & Clear — always first */}
        {sampleData && (
          <Button onClick={handleSample} variant="secondary">
            Sample
          </Button>
        )}
        <Button onClick={handleClear} variant="secondary" disabled={!hasContent}>
          Clear
        </Button>

        {/* Tool-specific action buttons */}
        {actions.map((action) => (
          <Button
            key={action.label}
            onClick={action.onClick}
            variant="secondary"
          >
            {action.label}
          </Button>
        ))}

        {/* Mode selector — pushed to the right */}
        {mode && (
          <div className="ml-auto">
            <SegmentedControl
              options={mode.options}
              value={mode.value}
              onChange={mode.onChange}
            />
          </div>
        )}
      </div>

      {/* Split pane — resizable */}
      <div className="flex-1 flex min-h-0" ref={containerRef}>
        {/* Input */}
        <div className="flex flex-col min-h-0 min-w-0" style={{ width: `${splitPercent}%` }}>
          <PaneHeader label="Input">
            {showPasteHint && (
              <PasteIcon match={clipboardMatch} onClick={handlePaste} />
            )}
          </PaneHeader>
          <Textarea value={inputValue} onChange={onInputChange} placeholder={placeholder} />
        </div>

        {/* Drag handle */}
        <div
          className="w-px bg-gray-200/60 dark:bg-white/[0.06] relative cursor-col-resize group flex-shrink-0"
          onMouseDown={onMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/10 transition-colors duration-150" />
        </div>

        {/* Output */}
        <div className="flex flex-col min-h-0 min-w-0 flex-1">
          <PaneHeader label="Output">
            {outputValue && <CopyButton text={outputValue} />}
          </PaneHeader>
          <div className="flex-1 overflow-auto p-3">
            {outputElement ?? (
              <pre className="text-[13px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {outputValue}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Meta / Error bar */}
      {(meta || error) && (
        <div className={cn(
          "px-3 py-1.5 border-t text-xs transition-colors duration-200",
          error
            ? "border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20"
            : "border-gray-200/60 dark:border-white/[0.06]"
        )}>
          {error ? (
            <span className="text-red-500 dark:text-red-400">{error}</span>
          ) : (
            <span className="text-gray-500/80 dark:text-gray-400/80">{meta}</span>
          )}
        </div>
      )}
    </div>
  );
}
