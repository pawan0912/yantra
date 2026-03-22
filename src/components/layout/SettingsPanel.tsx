import { useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "../../hooks/useTheme";
import { tools, TOOL_CATEGORIES } from "../../tools/registry";
import { toolConfigAtom, setToolConfigAtom } from "../../store/atoms";
import { cn } from "../../lib/utils";
import { SectionTitle, Card, Kbd } from "../ui";

const THEME_OPTIONS = [
  { value: "system" as const, label: "System", icon: "💻", desc: "Match macOS appearance" },
  { value: "light" as const, label: "Light", icon: "☀️", desc: "Always light" },
  { value: "dark" as const, label: "Dark", icon: "🌙", desc: "Always dark" },
];

const SHORTCUTS = [
  { keys: "⌘ K", desc: "Command palette" },
  { keys: "⌘ 1–9, 0", desc: "Switch tools" },
  { keys: "⌘ ,", desc: "Settings" },
  { keys: "⌃⇧ Space", desc: "Quick launch" },
];

function ToolsSection(): React.ReactElement {
  const config = useAtomValue(toolConfigAtom);
  const setConfig = useSetAtom(setToolConfigAtom);

  const isEnabled = (id: string): boolean => {
    const cfg = config[id];
    return cfg ? cfg.enabled : true;
  };

  const toggleTool = (id: string): void => {
    const current = config[id] ?? { enabled: true, order: 0 };
    setConfig({ ...config, [id]: { ...current, enabled: !current.enabled } });
  };

  return (
    <section>
      <SectionTitle subtitle="Toggle tools on or off. Disabled tools are hidden from the sidebar.">Tools</SectionTitle>
      {TOOL_CATEGORIES.map((cat) => {
        const catTools = tools.filter((t) => t.category === cat.id);
        if (catTools.length === 0) return null;
        return (
          <div key={cat.id} className="mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/70 dark:text-gray-500/70 mb-1 px-1">
              {cat.label}
            </div>
            <Card>
              {catTools.map((tool, i) => (
                <div
                  key={tool.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5",
                    i > 0 && "border-t border-gray-200/40 dark:border-white/[0.04]"
                  )}
                >
                  <tool.icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-800 dark:text-gray-200">{tool.name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{tool.description}</div>
                  </div>
                  <button
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      "relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0",
                      isEnabled(tool.id)
                        ? "bg-blue-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200",
                        isEnabled(tool.id) ? "translate-x-[16px]" : "translate-x-[2px]"
                      )}
                    />
                  </button>
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </section>
  );
}

export function SettingsScreen(): React.ReactElement {
  const { preference, setPreference } = useTheme();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-6 space-y-8">
        {/* Appearance */}
        <section>
          <SectionTitle subtitle="Choose how Yantra looks on your system.">Appearance</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreference(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-[12px]",
                  "transition-all duration-150 ease-out",
                  preference === opt.value
                    ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/25 shadow-sm"
                    : "bg-gray-100/60 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-white/[0.07] ring-1 ring-transparent"
                )}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-medium">{opt.label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Tools */}
        <ToolsSection />

        {/* Keyboard shortcuts */}
        <section>
          <SectionTitle subtitle="Navigate faster with these shortcuts.">Keyboard Shortcuts</SectionTitle>
          <Card divided>
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <span className="text-gray-700 dark:text-gray-300">{s.desc}</span>
                <Kbd variant="contained">{s.keys}</Kbd>
              </div>
            ))}
          </Card>
        </section>

        {/* About */}
        <section>
          <SectionTitle>About</SectionTitle>
          <Card className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-gray-200 font-mono text-[12px]">0.1.0</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-600 dark:text-gray-400">Built with</span>
              <span className="text-gray-900 dark:text-gray-200 text-[12px]">Tauri v2 + React</span>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
