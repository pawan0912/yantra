import { Suspense } from "react";
import { tools } from "../../tools/registry";
import { cn } from "../../lib/utils";

type AppShellProps = {
  activeToolId: string;
  onToolSelect: (toolId: string) => void;
  clipboardText: string;
};

export function AppShell({ activeToolId, onToolSelect, clipboardText }: AppShellProps): React.ReactElement {
  const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <nav className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="px-3 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
          Yantra
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
                tool.id === activeToolId
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <span className="w-5 text-center text-xs">{tool.icon}</span>
              <span className="truncate">{tool.name}</span>
              <kbd className="ml-auto text-[10px] text-gray-400 dark:text-gray-600">
                ⌘{tool.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Loading...
            </div>
          }
        >
          <ActiveComponent clipboardText={clipboardText} />
        </Suspense>
      </main>
    </div>
  );
}
