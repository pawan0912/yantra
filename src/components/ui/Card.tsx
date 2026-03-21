import { cn } from "../../lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
};

export function Card({ children, className, divided = false }: CardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-xl bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-gray-200/60 dark:ring-white/[0.06]",
        divided && "divide-y divide-gray-200/60 dark:divide-white/[0.06]",
        className
      )}
    >
      {children}
    </div>
  );
}
