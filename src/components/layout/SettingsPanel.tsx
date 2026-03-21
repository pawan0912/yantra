import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/utils";

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const THEME_OPTIONS = [
  { value: "system" as const, label: "System", icon: "💻" },
  { value: "light" as const, label: "Light", icon: "☀️" },
  { value: "dark" as const, label: "Dark", icon: "🌙" },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps): React.ReactElement | null {
  const { preference, setPreference } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 animate-in fade-in"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl
                   shadow-2xl border border-gray-200/50 dark:border-gray-700/50
                   overflow-hidden animate-in slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Theme */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Appearance
            </label>
            <div className="mt-2 flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreference(opt.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium",
                    "transition-all duration-200",
                    preference === opt.value
                      ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80"
                  )}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts reference */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Shortcuts
            </label>
            <div className="mt-2 space-y-1.5">
              {[
                { keys: "⌘ K", desc: "Command palette" },
                { keys: "⌘ 1-3", desc: "Switch tools" },
                { keys: "⌃⇧ Space", desc: "Toggle window" },
              ].map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium rounded-md
                       bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                       hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
