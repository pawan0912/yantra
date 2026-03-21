import { CopyButton } from "./CopyButton";

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
};

export function ToolPane({
  inputValue,
  onInputChange,
  outputValue,
  outputElement,
  actions,
  meta,
  error,
}: ToolPaneProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              action.active
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {action.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton text={outputValue} />
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 min-h-0">
        {/* Input */}
        <div className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            Input
          </div>
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 p-3 bg-transparent text-sm font-mono text-gray-900 dark:text-gray-100
                       resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="Paste or type here..."
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            Output
          </div>
          <div className="flex-1 overflow-auto p-3">
            {outputElement ?? (
              <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {outputValue}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Meta / Error bar */}
      {(meta || error) && (
        <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 text-xs">
          {error ? (
            <span className="text-red-500 dark:text-red-400">{error}</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{meta}</span>
          )}
        </div>
      )}
    </div>
  );
}
