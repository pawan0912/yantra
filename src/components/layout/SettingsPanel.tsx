import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/utils";

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

export function SettingsScreen(): React.ReactElement {
  const { preference, setPreference } = useTheme();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto py-8 px-6 space-y-8">
        {/* Appearance */}
        <section>
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Appearance
          </h3>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
            Choose how Yantra looks on your system.
          </p>
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

        {/* Keyboard shortcuts */}
        <section>
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Keyboard Shortcuts
          </h3>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
            Navigate faster with these shortcuts.
          </p>
          <div className="rounded-xl bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-gray-200/60 dark:ring-white/[0.06] divide-y divide-gray-200/60 dark:divide-white/[0.06]">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <span className="text-gray-700 dark:text-gray-300">{s.desc}</span>
                <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 font-mono text-[11px] shadow-sm ring-1 ring-gray-200/80 dark:ring-white/[0.08]">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
            About
          </h3>
          <div className="rounded-xl bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-gray-200/60 dark:ring-white/[0.06] px-4 py-3 space-y-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-gray-200 font-mono text-[12px]">0.1.0</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-600 dark:text-gray-400">Built with</span>
              <span className="text-gray-900 dark:text-gray-200 text-[12px]">Tauri v2 + React</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
