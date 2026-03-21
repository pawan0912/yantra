import { cn } from "../../lib/utils";

type ToggleOption = {
  label: string;
  value: string;
};

type ToggleProps = {
  options: [ToggleOption, ToggleOption];
  value: string;
  onChange: (value: string) => void;
};

export function Toggle({ options, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded transition-colors",
            value === option.value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
