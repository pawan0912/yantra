import { cn } from "../../lib/utils";

type SectionTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
};

export function SectionTitle({ children, subtitle, className }: SectionTitleProps): React.ReactElement {
  return (
    <div className={cn("mb-3", className)}>
      <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </h3>
      {subtitle && (
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
