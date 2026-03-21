import { Suspense } from "react";
import { tools } from "../../tools/registry";
import { cn } from "../../lib/utils";
import { WindowControls } from "./WindowControls";

type AppShellProps = {
  activeToolId: string;
  onToolSelect: (toolId: string) => void;
  clipboardText: string;
  onSettingsOpen: () => void;
};

export function AppShell({ activeToolId, onToolSelect, clipboardText, onSettingsOpen }: AppShellProps): React.ReactElement {
  const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex h-screen rounded-xl overflow-hidden bg-white/80 dark:bg-gray-950/90 backdrop-blur-2xl text-gray-900 dark:text-gray-100 border border-gray-200/40 dark:border-gray-700/40 shadow-lg">
      {/* Sidebar */}
      <nav className="w-[180px] flex-shrink-0 border-r border-gray-200/60 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03] flex flex-col select-none">
        {/* Drag region + traffic lights */}
        <div className="flex items-center h-12 gap-3" data-tauri-drag-region>
          <WindowControls />
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left",
                "transition-all duration-150 ease-out",
                tool.id === activeToolId
                  ? "bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium shadow-sm shadow-blue-500/5"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.06] active:bg-gray-200/80 dark:active:bg-white/[0.08]"
              )}
            >
              <span className="w-5 text-center text-xs opacity-80">{tool.icon}</span>
              <span className="truncate flex-1">{tool.name}</span>
              <kbd className="text-[10px] text-gray-400/70 dark:text-gray-500/70 font-mono tabular-nums">
                {"\u2318"}{tool.shortcut}
              </kbd>
            </button>
          ))}
        </div>

        {/* Settings button */}
        <div className="px-2 py-2 border-t border-gray-200/60 dark:border-white/[0.06]">
          <button
            onClick={onSettingsOpen}
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left
                       text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.06]
                       transition-all duration-150 ease-out"
          >
            <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {/* Main drag region / title bar */}
        <div className="h-12 flex items-center px-4 border-b border-gray-200/60 dark:border-white/[0.06] flex-shrink-0" data-tauri-drag-region>
          <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 pointer-events-none" data-tauri-drag-region>
            {activeTool.name}
          </span>
        </div>

        {/* Tool content */}
        <div className="flex-1 min-h-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                <div className="animate-pulse">Loading...</div>
              </div>
            }
          >
            <ActiveComponent clipboardText={clipboardText} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
