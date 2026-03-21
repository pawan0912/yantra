import { cn } from "../../lib/utils";

type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const baseClass = [
  "flex-1 p-3 bg-transparent text-[13px] font-mono leading-relaxed",
  "text-gray-800 dark:text-gray-200",
  "resize-none focus:outline-none",
  "placeholder-gray-400/60 dark:placeholder-gray-600/60",
  "selection:bg-blue-500/20",
].join(" ");

export function Textarea({ value, onChange, placeholder, className }: TextareaProps): React.ReactElement {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(baseClass, className)}
      spellCheck={false}
    />
  );
}
