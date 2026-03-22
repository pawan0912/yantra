import { cn } from "../../lib/utils";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg p-[3px] gap-[1px]",
        "bg-gray-200/80 dark:bg-white/[0.08]",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-[3px] text-xs font-medium rounded-md transition-all duration-150 ease-out",
            opt.value === value
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm shadow-black/[0.06]"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
