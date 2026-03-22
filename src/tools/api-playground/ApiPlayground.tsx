import { useState } from "react";
import { useAtom } from "jotai";
import { apiPlaygroundAtoms } from "../../store/atoms";
import type { ToolProps } from "../types";
import {
  sendRequest,
  generateId,
  toCurl,
  createEmptyRequest,
  createEmptyPair,
} from "./api-playground.utils";
import type { RequestConfig, HttpMethod, HistoryEntry } from "./api-playground.utils";
import { parseCurl } from "../curl/curl.utils";
import { UrlBar } from "./components/UrlBar";
import { ActionBar } from "./components/ActionBar";
import { RequestTabs } from "./components/RequestTabs";
import { ResponseView } from "./components/ResponseView";
import { HistoryPanel } from "./components/HistoryPanel";
import { CurlImportModal } from "./components/CurlImportModal";

export function ApiPlayground(_props: ToolProps): React.ReactElement {
  const [state, setState] = useAtom(apiPlaygroundAtoms.stateAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCurlImport, setShowCurlImport] = useState(false);

  const { request, response, history } = state;

  const updateRequest = (partial: Partial<RequestConfig>): void => {
    setState((prev) => ({ ...prev, request: { ...prev.request, ...partial } }));
  };

  const handleNew = (): void => {
    const fresh = createEmptyRequest();
    setState((prev) => ({ ...prev, request: fresh, response: null }));
    setError(null);
    setShowHistory(false);
  };

  const handleClear = (): void => {
    const fresh = createEmptyRequest();
    setState((prev) => ({ ...prev, request: fresh, response: null }));
    setError(null);
  };

  const handleSend = async (): Promise<void> => {
    if (!request.url.trim()) return;
    setLoading(true);
    setError(null);
    setShowHistory(false);

    try {
      const result = await sendRequest({ config: request });
      const entry: HistoryEntry = {
        id: generateId(),
        timestamp: Date.now(),
        request: { ...request },
        response: result,
      };

      setState((prev) => ({
        ...prev,
        response: result,
        history: [entry, ...prev.history].slice(0, 50),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState((prev) => ({ ...prev, response: null }));
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry): void => {
    setState((prev) => ({
      ...prev,
      request: { ...entry.request },
      response: entry.response,
    }));
    setShowHistory(false);
  };

  const handleExportCurl = async (): Promise<void> => {
    const curl = toCurl({ config: request });
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(curl);
    } catch {
      await navigator.clipboard.writeText(curl);
    }
  };

  const handleImportCurl = (curlCommand: string): void => {
    const result = parseCurl({ input: curlCommand });
    if (!result.isValid) {
      setError(result.error);
      return;
    }

    const headers = Object.entries(result.headers).map(([key, value]) => ({
      key, value, enabled: true,
    }));
    if (headers.length === 0) {
      headers.push(createEmptyPair());
    }

    updateRequest({
      method: result.method as HttpMethod,
      url: result.url,
      headers,
      body: result.body ?? "",
      bodyType: result.body ? "json" : "none",
      auth: result.auth
        ? { type: "basic" as const, username: result.auth.value.split(":")[0], password: result.auth.value.split(":")[1] ?? "" }
        : { type: "none" as const },
    });
    setShowCurlImport(false);
    setShowHistory(false);
    setError(null);
  };

  const hasContent = Boolean(request.url || request.body || response);

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar — new, clear, history, import, export (above URL bar) */}
      <ActionBar
        showHistory={showHistory}
        hasContent={hasContent}
        onNew={handleNew}
        onClear={handleClear}
        onToggleHistory={() => setShowHistory((h) => !h)}
        onImportCurl={() => setShowCurlImport(true)}
        onExportCurl={handleExportCurl}
      />

      {/* URL Bar — method + url + send */}
      <UrlBar
        method={request.method}
        url={request.url}
        loading={loading}
        onMethodChange={(method) => updateRequest({ method, bodyType: method === "GET" || method === "HEAD" ? "none" : request.bodyType })}
        onUrlChange={(url) => updateRequest({ url })}
        onSend={handleSend}
      />

      {/* Error bar */}
      {error && (
        <div className="px-3 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-red-200/60 dark:border-red-900/30 text-xs text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main content — request + response or history */}
      {showHistory ? (
        <HistoryPanel
          history={history}
          onSelect={handleHistorySelect}
          onClear={() => setState((prev) => ({ ...prev, history: [] }))}
        />
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Request pane */}
          <div className="w-1/2 flex flex-col border-r border-gray-200/60 dark:border-white/[0.06] min-h-0">
            <RequestTabs
              request={request}
              onUpdate={updateRequest}
            />
          </div>

          {/* Response pane */}
          <div className="w-1/2 flex flex-col min-h-0">
            <ResponseView response={response} loading={loading} />
          </div>
        </div>
      )}

      {/* cURL Import Modal */}
      {showCurlImport && (
        <CurlImportModal
          onImport={handleImportCurl}
          onClose={() => setShowCurlImport(false)}
        />
      )}
    </div>
  );
}
