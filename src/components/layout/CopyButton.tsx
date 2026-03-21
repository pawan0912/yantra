import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md
                 bg-gray-100/80 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400
                 hover:bg-gray-200/80 dark:hover:bg-white/[0.1] active:scale-[0.97]
                 transition-all duration-150 ease-out"
      title="Copy to clipboard"
    >
      <div className="relative w-3.5 h-3.5">
        <Copy
          className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-200 ${copied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
          strokeWidth={2}
        />
        <Check
          className={`absolute inset-0 w-3.5 h-3.5 text-green-500 transition-all duration-200 ${copied ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
          strokeWidth={2}
        />
      </div>
      <span className="transition-colors duration-200">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
