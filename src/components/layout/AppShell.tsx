import { Suspense, useState } from "react";
import { useAtomValue } from "jotai";
import { Settings, PanelLeft, PanelLeftClose, ChevronDown } from "lucide-react";
import { tools, TOOL_CATEGORIES } from "../../tools/registry";
import type { ToolPlugin } from "../../tools/types";
import { toolConfigAtom } from "../../store/atoms";
import { cn } from "../../lib/utils";
import { SettingsScreen } from "./SettingsPanel";

type AppShellProps = {
  activeToolId: string;
  onToolSelect: (toolId: string) => void;
  clipboardText: string;
  showSettings: boolean;
  onSettingsToggle: () => void;
};

function SidebarToggleIcon({ open }: { open: boolean }): React.ReactElement {
  const Icon = open ? PanelLeftClose : PanelLeft;
  return <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />;
}

function useVisibleTools(): Array<{ category: string; label: string; tools: ToolPlugin[] }> {
  const config = useAtomValue(toolConfigAtom);

  const enabledTools = tools.filter((t) => {
    const cfg = config[t.id];
    return cfg ? cfg.enabled : true;
  });

  const sorted = [...enabledTools].sort((a, b) => {
    const orderA = config[a.id]?.order ?? Infinity;
    const orderB = config[b.id]?.order ?? Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return 0;
  });

  const groups: Array<{ category: string; label: string; tools: ToolPlugin[] }> = [];
  for (const cat of TOOL_CATEGORIES) {
    const catTools = sorted.filter((t) => t.category === cat.id);
    if (catTools.length > 0) {
      groups.push({ category: cat.id, label: cat.label, tools: catTools });
    }
  }
  return groups;
}

function CollapsibleGroup({ label, tools: groupTools, activeToolId, showSettings, onToolSelect, isFirst }: {
  label: string;
  tools: ToolPlugin[];
  activeToolId: string;
  showSettings: boolean;
  onToolSelect: (id: string) => void;
  isFirst: boolean;
}): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(!isFirst && "mt-2")}>
      {/* Category header — clickable to collapse */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400/70 dark:text-gray-500/70 whitespace-nowrap hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-150"
      >
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform duration-150",
            collapsed && "-rotate-90"
          )}
          strokeWidth={2}
        />
        {label}
      </button>

      {/* Tools */}
      {!collapsed && (
        <div className="space-y-0.5">
          {groupTools.map((tool) => (
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ activeToolId, onToolSelect, clipboardText, showSettings, onSettingsToggle }: AppShellProps): React.ReactElement {
  const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];
  const ActiveComponent = activeTool.component;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const groups = useVisibleTools();

  const titleText = showSettings ? "Settings" : activeTool.name;

  return (
    <div className="flex flex-col h-screen bg-white/80 dark:bg-gray-950/90 backdrop-blur-2xl text-gray-900 dark:text-gray-100">
      {/* ── Top title bar ── */}
      <div
        className="flex items-center flex-shrink-0 border-b border-gray-200/60 dark:border-white/[0.06]"
        style={{ paddingLeft: "var(--traffic-light-inset)", height: "var(--titlebar-height)" }}
        data-tauri-drag-region
      >
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="p-1 rounded-md text-gray-400/60 dark:text-gray-500/50
                     hover:text-gray-600 dark:hover:text-gray-300
                     hover:bg-gray-200/60 dark:hover:bg-white/[0.06]
                     transition-all duration-150 ease-out"
        >
          <SidebarToggleIcon open={sidebarOpen} />
        </button>

        <span className="flex-1 text-center text-[13px] font-medium text-gray-500 dark:text-gray-400 pointer-events-none" style={{ paddingRight: "calc(var(--traffic-light-inset) + 28px)" }} data-tauri-drag-region>
          {titleText}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <nav
          className={cn(
            "flex-shrink-0 border-r border-gray-200/60 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.03] flex flex-col select-none",
            "transition-[width,border] duration-200 ease-out overflow-hidden",
            sidebarOpen ? "w-[180px]" : "w-0 border-r-0"
          )}
        >
          {/* Grouped tool list with collapsible sections */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {groups.map((group, gi) => (
              <CollapsibleGroup
                key={group.category}
                label={group.label}
                tools={group.tools}
                activeToolId={activeToolId}
                showSettings={showSettings}
                onToolSelect={onToolSelect}
                isFirst={gi === 0}
              />
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
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-0">
          {showSettings ? (
            <SettingsScreen />
          ) : (
            <Suspense fallback={<div className="h-full" />}>
              <ActiveComponent clipboardText={clipboardText} clipboardMatch={activeTool.matchClipboard(clipboardText)} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
