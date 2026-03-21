import { cn } from "../../lib/utils";

type TabBarProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps): React.ReactElement {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium border-b-2 transition-colors",
            activeTab === tab
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
