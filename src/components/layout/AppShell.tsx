import { Suspense, useState } from "react";
import { Settings } from "lucide-react";
import { tools } from "../../tools/registry";
import { cn } from "../../lib/utils";
import { SettingsScreen } from "./SettingsPanel";

type AppShellProps = {
  activeToolId: string;
  onToolSelect: (toolId: string) => void;
  clipboardText: string;
  showSettings: boolean;
  onSettingsToggle: () => void;
};

function SidebarIcon(): React.ReactElement {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

export function AppShell({ activeToolId, onToolSelect, clipboardText, showSettings, onSettingsToggle }: AppShellProps): React.ReactElement {
  const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];
  const ActiveComponent = activeTool.component;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const titleText = showSettings ? "Settings" : activeTool.name;

  return (
    <div className="flex flex-col h-screen bg-white/80 dark:bg-gray-950/90 backdrop-blur-2xl text-gray-900 dark:text-gray-100">
      {/* ── Top title bar — full width, independent of sidebar ── */}
      <div
        className="flex items-center flex-shrink-0 border-b border-gray-200/60 dark:border-white/[0.06]"
        style={{ paddingLeft: "var(--traffic-light-inset)", height: "var(--titlebar-height)" }}
        data-tauri-drag-region
      >
        {/* Sidebar toggle — always in the same position */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="p-1 rounded-md text-gray-400/60 dark:text-gray-500/50
                     hover:text-gray-600 dark:hover:text-gray-300
                     hover:bg-gray-200/60 dark:hover:bg-white/[0.06]
                     transition-all duration-150 ease-out"
        >
          <SidebarIcon />
        </button>

        {/* Centered title */}
        <span className="flex-1 text-center text-[13px] font-medium text-gray-500 dark:text-gray-400 pointer-events-none" style={{ paddingRight: "calc(var(--traffic-light-inset) + 28px)" }} data-tauri-drag-region>
          {titleText}
        </span>
      </div>

      {/* ── Body — sidebar + content ── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <nav
          className={cn(
            "flex-shrink-0 border-r border-gray-200/60 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03] flex flex-col select-none",
            "transition-[width,border] duration-200 ease-out overflow-hidden",
            sidebarOpen ? "w-[180px]" : "w-0 border-r-0"
          )}
        >
          {/* Tool list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left whitespace-nowrap",
                  "transition-all duration-150 ease-out",
                  !showSettings && tool.id === activeToolId
                    ? "bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium shadow-sm shadow-blue-500/5"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.06] active:bg-gray-200/80 dark:active:bg-white/[0.08]"
                )}
              >
                <tool.icon className="w-4 h-4 opacity-70 flex-shrink-0" strokeWidth={1.5} />
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
              onClick={onSettingsToggle}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left whitespace-nowrap",
                "transition-all duration-150 ease-out",
                showSettings
                  ? "bg-blue-500/12 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium shadow-sm shadow-blue-500/5"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.06]"
              )}
            >
              <Settings className="w-4 h-4 opacity-70" strokeWidth={1.5} />
              <span>Settings</span>
              <kbd className="ml-auto text-[10px] text-gray-400/70 dark:text-gray-500/70 font-mono">
                {"\u2318"},
              </kbd>
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-0">
          {showSettings ? (
            <SettingsScreen />
          ) : (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
                  <div className="animate-pulse">Loading...</div>
                </div>
              }
            >
              <ActiveComponent clipboardText={clipboardText} clipboardMatch={activeTool.matchClipboard(clipboardText)} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
