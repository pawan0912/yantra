import { useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { useToolState } from "../../hooks/useToolState";
import { parseCurl, toFetch, toAxios, toReactQuery, highlightCode } from "./curl.utils";
import type { ToolProps } from "../registry";

type OutputFormat = "fetch" | "axios" | "reactQuery";

const generators: Record<
  OutputFormat,
  (args: { method: string; url: string; headers: Record<string, string>; body: string | null }) => string
> = {
  fetch: toFetch,
  axios: toAxios,
  reactQuery: toReactQuery,
};

const SAMPLE_DATA = `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token123" \\
  -d '{"name": "John", "email": "john@example.com"}'`;

export function CurlConverter({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const { state, update, reset } = useToolState({
    toolId: "curl",
    initial: { input: "", format: "fetch" as OutputFormat },
  });

  const parsed = useMemo(() => {
    if (!state.input.trim()) return null;
    return parseCurl({ input: state.input });
  }, [state.input]);

  const output = useMemo(() => {
    if (!parsed || !parsed.isValid) return "";
    return generators[state.format]({
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
    });
  }, [parsed, state.format]);

  const highlighted = useMemo(() => {
    if (!output) return null;
    return highlightCode({ code: output });
  }, [output]);

  const meta = useMemo(() => {
    if (!parsed || !parsed.isValid) return undefined;
    const truncatedUrl = parsed.url.length > 60 ? parsed.url.slice(0, 60) + "..." : parsed.url;
    return `${parsed.method} ${truncatedUrl}`;
  }, [parsed]);

  const error = state.input.trim() && parsed && !parsed.isValid ? parsed.error : undefined;

  const actions = [
    { label: "fetch", onClick: () => update({ format: "fetch" }), active: state.format === "fetch" },
    { label: "axios", onClick: () => update({ format: "axios" }), active: state.format === "axios" },
    { label: "React Query", onClick: () => update({ format: "reactQuery" }), active: state.format === "reactQuery" },
  ];

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => update({ input: v })}
      outputValue={output}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      outputElement={
        highlighted ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : undefined
      }
      placeholder="Paste a cURL command to convert..."
      actions={actions}
      meta={meta}
      error={error}
    />
  );
}
