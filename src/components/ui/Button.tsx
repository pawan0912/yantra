import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "icon" | "small";

type ButtonProps = {
  children?: React.ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  active?: boolean;
  title?: string;
  icon?: LucideIcon;
  className?: string;
};

const base = "transition-all duration-150 ease-out";

const variants: Record<ButtonVariant, { normal: string; active: string }> = {
  primary: {
    normal: "px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white shadow-sm shadow-blue-500/25 active:scale-[0.97]",
    active: "px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white shadow-sm shadow-blue-500/25",
  },
  secondary: {
    normal: "px-3 py-1 text-xs font-medium rounded-md bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/[0.1] active:scale-[0.97]",
    active: "px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white shadow-sm shadow-blue-500/25",
  },
  icon: {
    normal: "p-1 rounded-md text-gray-400/60 dark:text-gray-500/50 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/[0.06]",
    active: "p-1 rounded-md text-blue-500/80 dark:text-blue-400/80 bg-blue-500/10 dark:bg-blue-500/15",
  },
  small: {
    normal: "px-2 py-0.5 rounded-md text-[11px] bg-gray-100/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/[0.1]",
    active: "px-2 py-0.5 rounded-md text-[11px] bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30",
  },
};

export function Button({
  children,
  onClick,
  variant = "secondary",
  active = false,
  title,
  icon: Icon,
  className,
}: ButtonProps): React.ReactElement {
  const style = active ? variants[variant].active : variants[variant].normal;

  return (
    <button onClick={onClick} title={title} className={cn(base, style, className)}>
      {Icon && <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
      {children}
    </button>
  );
}
