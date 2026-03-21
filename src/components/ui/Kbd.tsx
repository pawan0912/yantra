import { cn } from "../../lib/utils";

type KbdVariant = "inline" | "contained";

type KbdProps = {
  children: React.ReactNode;
  variant?: KbdVariant;
  className?: string;
};

const styles: Record<KbdVariant, string> = {
  inline: "text-[10px] text-gray-400/70 dark:text-gray-500/70 font-mono tabular-nums",
  contained: "px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 font-mono text-[11px] shadow-sm ring-1 ring-gray-200/80 dark:ring-white/[0.08]",
};

export function Kbd({ children, variant = "inline", className }: KbdProps): React.ReactElement {
  return (
    <kbd className={cn(styles[variant], className)}>
      {children}
    </kbd>
  );
}
