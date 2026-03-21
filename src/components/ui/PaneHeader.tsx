import { cn } from "../../lib/utils";

type PaneHeaderProps = {
  label: string;
  children?: React.ReactNode;
  className?: string;
};

export function PaneHeader({ label, children, className }: PaneHeaderProps): React.ReactElement {
  return (
    <div className={cn("flex items-center h-7 px-3 border-b border-gray-200/40 dark:border-white/[0.04]", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400/80 dark:text-gray-500/80 flex-1">
        {label}
      </span>
      {children}
    </div>
  );
}
