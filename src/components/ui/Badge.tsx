import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
} as const;

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
};

export function Badge({ children, variant = "default" }: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
