import { useState } from "react";
import { cn } from "../../../lib/utils";
import { CopyButton } from "../../../components/layout/CopyButton";
import { formatBytes, getStatusColor, tryPrettyJson } from "../api-playground.utils";
import type { ResponseData } from "../api-playground.utils";

type ResponseViewProps = {
  response: ResponseData | null;
  loading: boolean;
};

type Tab = "body" | "headers";

export function ResponseView({ response, loading }: ResponseViewProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("body");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Sending request...
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-400 dark:text-gray-500">No response yet</div>
          <div className="text-[11px] text-gray-400/60 dark:text-gray-500/60 mt-1">
            Enter a URL and press Send or ⌘↩
          </div>
        </div>
      </div>
    );
  }

  const prettyBody = tryPrettyJson({ text: response.body });
  const tabs: Tab[] = ["body", "headers"];

  return (
    <>
      {/* Status bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-200/60 dark:border-white/[0.06] text-[11px]">
        <span className={cn("font-bold", getStatusColor({ status: response.status }))}>
          {response.status} {response.statusText}
        </span>
        <span className="text-gray-400 dark:text-gray-500">{response.timeMs}ms</span>
        <span className="text-gray-400 dark:text-gray-500">{formatBytes({ bytes: response.sizeBytes })}</span>
        <div className="ml-auto">
          <CopyButton text={prettyBody} />
        </div>
      </div>

      {/* Response tabs */}
      <div className="flex items-center border-b border-gray-200/60 dark:border-white/[0.06] px-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-2 text-[11px] font-medium capitalize transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {tab}
            {tab === "headers" && (
              <span className="ml-1 text-[9px] text-gray-400">({Object.keys(response.headers).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "body" && (
          <pre className="text-[12px] font-mono leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {prettyBody}
          </pre>
        )}
        {activeTab === "headers" && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-[12px] font-mono">
                <span className="text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">{key}:</span>
                <span className="text-gray-700 dark:text-gray-300 break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
