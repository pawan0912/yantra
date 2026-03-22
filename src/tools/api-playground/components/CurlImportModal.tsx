import { useState } from "react";
import { Button } from "../../../components/ui";

type CurlImportModalProps = {
  onImport: (curlCommand: string) => void;
  onClose: () => void;
};

export function CurlImportModal({ onImport, onClose }: CurlImportModalProps): React.ReactElement {
  const [value, setValue] = useState("");

  const handlePaste = async (): Promise<void> => {
    try {
      const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
      const text = await readText();
      if (text) setValue(text);
    } catch {
      const text = await navigator.clipboard.readText();
      if (text) setValue(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-[520px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl
                   shadow-2xl shadow-black/20 border border-gray-200/50 dark:border-gray-700/50
                   overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">Import cURL</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Paste a cURL command to fill the request details
          </p>
        </div>

        <div className="p-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`curl -X POST 'https://api.example.com/data' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"key": "value"}'`}
            className="w-full h-32 text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03]
                       border border-gray-200/60 dark:border-white/[0.06] rounded-lg p-3
                       text-gray-800 dark:text-gray-200 resize-none focus:outline-none
                       focus:ring-1 focus:ring-blue-500/30 placeholder-gray-400/50 dark:placeholder-gray-600/50"
            spellCheck={false}
            autoFocus
          />
        </div>

        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <Button variant="secondary" onClick={handlePaste}>
            Paste from clipboard
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => onImport(value)}
              disabled={!value.trim()}
            >
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
