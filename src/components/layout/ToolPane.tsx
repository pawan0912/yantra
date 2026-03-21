import { useState, useEffect } from "react";
import { CopyButton } from "./CopyButton";
import { cn } from "../../lib/utils";

type ToolAction = {
  label: string;
  onClick: () => void;
  active?: boolean;
};

type ToolPaneProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  outputValue: string;
  outputElement?: React.ReactNode;
  actions: ToolAction[];
  meta?: string;
  error?: string;
  placeholder?: string;
  clipboardText?: string;
  clipboardMatch?: boolean;
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
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </button>
  );
}

export function ToolPane({
  inputValue,
  onInputChange,
  outputValue,
  outputElement,
  actions,
  meta,
  error,
  placeholder = "Paste or type here...",
  clipboardText = "",
  clipboardMatch = false,
}: ToolPaneProps): React.ReactElement {
  const [pasted, setPasted] = useState(false);

  // Reset pasted state when clipboard changes
  useEffect(() => {
    setPasted(false);
  }, [clipboardText]);

  const handlePaste = (): void => {
    if (clipboardText) {
      onInputChange(clipboardText);
      setPasted(true);
    }
  };

  const showPasteHint = clipboardText && !pasted && !inputValue;

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200/60 dark:border-white/[0.06]">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ease-out",
              action.active
                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/25"
                : "bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/[0.1] active:scale-[0.97]"
            )}
          >
            {action.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton text={outputValue} />
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Input */}
        <div className="flex flex-col min-h-0 border-r border-gray-200/60 dark:border-white/[0.06]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200/40 dark:border-white/[0.04]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 dark:text-gray-500/80">
              Input
            </span>
            {showPasteHint && (
              <PasteIcon match={clipboardMatch} onClick={handlePaste} />
            )}
          </div>
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 p-3 bg-transparent text-[13px] font-mono leading-relaxed text-gray-800 dark:text-gray-200
                       resize-none focus:outline-none placeholder-gray-400/60 dark:placeholder-gray-600/60
                       selection:bg-blue-500/20"
            placeholder={placeholder}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 dark:text-gray-500/80 border-b border-gray-200/40 dark:border-white/[0.04]">
            Output
          </div>
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
