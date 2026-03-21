import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { cn } from "../../lib/utils";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await writeText(text);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className={cn(
        "p-1 rounded-md transition-all duration-200 ease-out",
        "text-gray-400/60 dark:text-gray-500/60 hover:text-gray-600 dark:hover:text-gray-300",
        "hover:bg-gray-200/60 dark:hover:bg-white/[0.06]",
        copied && "text-green-500 dark:text-green-400"
      )}
    >
      <div className="relative w-3.5 h-3.5">
        <Copy
          className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-200 ${copied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
          strokeWidth={1.8}
        />
        <Check
          className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-200 ${copied ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          strokeWidth={1.8}
        />
      </div>
    </button>
  );
}
