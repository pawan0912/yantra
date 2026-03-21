import { useState, useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
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
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("fetch");

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    return parseCurl({ input });
  }, [input]);

  const output = useMemo(() => {
    if (!parsed || !parsed.isValid) return "";
    return generators[format]({
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
    });
  }, [parsed, format]);

  const highlighted = useMemo(() => {
    if (!output) return null;
    return highlightCode({ code: output });
  }, [output]);

  const meta = useMemo(() => {
    if (!parsed || !parsed.isValid) return undefined;
    const truncatedUrl = parsed.url.length > 60 ? parsed.url.slice(0, 60) + "..." : parsed.url;
    return `${parsed.method} ${truncatedUrl}`;
  }, [parsed]);

  const error = input.trim() && parsed && !parsed.isValid ? parsed.error : undefined;

  const actions = [
    { label: "fetch", onClick: () => setFormat("fetch"), active: format === "fetch" },
    { label: "axios", onClick: () => setFormat("axios"), active: format === "axios" },
    { label: "React Query", onClick: () => setFormat("reactQuery"), active: format === "reactQuery" },
  ];

  return (
    <ToolPane
      inputValue={input}
      onInputChange={setInput}
      outputValue={output}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      outputElement={
        highlighted ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : undefined
      }
      placeholder={'curl -X GET https://api.example.com/users \\\n  -H "Authorization: Bearer token"'}
      actions={actions}
      meta={meta}
      error={error}
    />
  );
}
