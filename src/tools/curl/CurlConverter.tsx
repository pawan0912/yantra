import { useAtom, useSetAtom } from "jotai";
import { ToolPane } from "../../components/layout/ToolPane";
import { curlToolAtoms } from "../../store/atoms";
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
  const [state, setState] = useAtom(curlToolAtoms.stateAtom);
  const reset = useSetAtom(curlToolAtoms.resetAtom);

  const parsed = (() => {
    if (!state.input.trim()) return null;
    return parseCurl({ input: state.input });
  })();

  const output = (() => {
    if (!parsed || !parsed.isValid) return "";
    return generators[state.format]({
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      body: parsed.body,
    });
  })();

  const highlighted = (() => {
    if (!output) return null;
    return highlightCode({ code: output });
  })();

  const meta = (() => {
    if (!parsed || !parsed.isValid) return undefined;
    const truncatedUrl = parsed.url.length > 60 ? parsed.url.slice(0, 60) + "..." : parsed.url;
    return `${parsed.method} ${truncatedUrl}`;
  })();

  const error = state.input.trim() && parsed && !parsed.isValid ? parsed.error : undefined;

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => setState((prev) => ({ ...prev, input: v }))}
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
      mode={{
        options: [
          { value: "fetch", label: "fetch" },
          { value: "axios", label: "axios" },
          { value: "reactQuery", label: "React Query" },
        ],
        value: state.format,
        onChange: (v) => setState((prev) => ({ ...prev, format: v as OutputFormat })),
      }}
      meta={meta}
      error={error}
    />
  );
}
