import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { createEmptyPair } from "../api-playground.utils";
import type { RequestConfig, KeyValuePair, AuthType } from "../api-playground.utils";

type RequestTabsProps = {
  request: RequestConfig;
  onUpdate: (partial: Partial<RequestConfig>) => void;
};

type Tab = "params" | "headers" | "body" | "auth";

function KeyValueEditor({
  pairs, onChange, addLabel,
}: {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  addLabel: string;
}): React.ReactElement {
  const update = (index: number, field: keyof KeyValuePair, value: string | boolean): void => {
    const next = pairs.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    onChange(next);
  };

  const remove = (index: number): void => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1 p-3">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={(e) => update(i, "enabled", e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-blue-500 flex-shrink-0"
          />
          <input
            type="text"
            value={pair.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder="Key"
            className="flex-1 text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]
                       rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/30
                       text-gray-800 dark:text-gray-200 placeholder-gray-400/50 dark:placeholder-gray-600/50"
          />
          <input
            type="text"
            value={pair.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]
                       rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/30
                       text-gray-800 dark:text-gray-200 placeholder-gray-400/50 dark:placeholder-gray-600/50"
          />
          <button
            onClick={() => remove(i)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...pairs, createEmptyPair()])}
        className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mt-1"
      >
        <Plus className="w-3 h-3" strokeWidth={1.5} />
        {addLabel}
      </button>
    </div>
  );
}

function AuthEditor({
  auth, onUpdate,
}: {
  auth: RequestConfig["auth"];
  onUpdate: (partial: Partial<RequestConfig>) => void;
}): React.ReactElement {
  return (
    <div className="p-3 space-y-3">
      <div className="flex gap-2">
        {(["none", "bearer", "basic"] as AuthType[]).map((type) => (
          <button
            key={type}
            onClick={() => onUpdate({ auth: { ...auth, type } })}
            className={cn(
              "px-3 py-1 text-[11px] font-medium rounded-md transition-all duration-150 capitalize",
              auth.type === type
                ? "bg-blue-500 text-white"
                : "bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/[0.1]"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {auth.type === "bearer" && (
        <input
          type="text"
          value={auth.token ?? ""}
          onChange={(e) => onUpdate({ auth: { ...auth, token: e.target.value } })}
          placeholder="Bearer token"
          className="w-full text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]
                     rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30
                     text-gray-800 dark:text-gray-200 placeholder-gray-400/50"
        />
      )}

      {auth.type === "basic" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={auth.username ?? ""}
            onChange={(e) => onUpdate({ auth: { ...auth, username: e.target.value } })}
            placeholder="Username"
            className="flex-1 text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]
                       rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30
                       text-gray-800 dark:text-gray-200 placeholder-gray-400/50"
          />
          <input
            type="password"
            value={auth.password ?? ""}
            onChange={(e) => onUpdate({ auth: { ...auth, password: e.target.value } })}
            placeholder="Password"
            className="flex-1 text-[12px] font-mono bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06]
                       rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30
                       text-gray-800 dark:text-gray-200 placeholder-gray-400/50"
          />
        </div>
      )}
    </div>
  );
}

export function RequestTabs({ request, onUpdate }: RequestTabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>("params");
  const showBody = request.method !== "GET" && request.method !== "HEAD";
  const tabs: Tab[] = showBody ? ["params", "headers", "body", "auth"] : ["params", "headers", "auth"];

  return (
    <>
      {/* Tab bar */}
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
            {tab === "params" && request.params.filter((p) => p.key.trim()).length > 0 && (
              <span className="ml-1 text-[9px] text-gray-400">({request.params.filter((p) => p.key.trim()).length})</span>
            )}
            {tab === "headers" && request.headers.filter((h) => h.key.trim()).length > 0 && (
              <span className="ml-1 text-[9px] text-gray-400">({request.headers.filter((h) => h.key.trim()).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "params" && (
          <KeyValueEditor
            pairs={request.params}
            onChange={(params) => onUpdate({ params })}
            addLabel="Add parameter"
          />
        )}
        {activeTab === "headers" && (
          <KeyValueEditor
            pairs={request.headers}
            onChange={(headers) => onUpdate({ headers })}
            addLabel="Add header"
          />
        )}
        {activeTab === "body" && showBody && (
          <div className="flex flex-col h-full">
            <div className="flex gap-1.5 px-3 pt-2">
              {(["json", "raw"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ bodyType: type })}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 uppercase",
                    request.bodyType === type
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100/80 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <textarea
              value={request.body}
              onChange={(e) => onUpdate({ body: e.target.value })}
              placeholder={request.bodyType === "json" ? '{\n  "key": "value"\n}' : "Request body..."}
              className="flex-1 p-3 text-[12px] font-mono bg-transparent text-gray-800 dark:text-gray-200
                         resize-none focus:outline-none placeholder-gray-400/50 dark:placeholder-gray-600/50"
              spellCheck={false}
            />
          </div>
        )}
        {activeTab === "auth" && (
          <AuthEditor auth={request.auth} onUpdate={onUpdate} />
        )}
      </div>
    </>
  );
}
