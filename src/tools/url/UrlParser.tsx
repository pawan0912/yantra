import { useAtom, useSetAtom } from "jotai";
import { ToolPane } from "../../components/layout/ToolPane";
import { urlToolAtoms } from "../../store/atoms";
import { parseUrl, encodeUrlString, decodeUrlString } from "./url.utils";
import type { ToolProps } from "../registry";

const SAMPLE_DATA = "https://api.example.com/v2/users?page=1&limit=25&sort=name&filter=active#results";

export function UrlParser({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [state, setState] = useAtom(urlToolAtoms.stateAtom);
  const reset = useSetAtom(urlToolAtoms.resetAtom);

  const parsed = (() => {
    if (!state.input.trim() || state.mode !== "parse") return null;
    return parseUrl({ input: state.input.trim() });
  })();

  const outputValue = ((): string => {
    if (!state.input.trim()) return "";
    if (state.mode === "encode") return encodeUrlString({ input: state.input });
    if (state.mode === "decode") return decodeUrlString({ input: state.input });
    return "";
  })();

  const meta = ((): string | undefined => {
    if (state.mode !== "parse" || !parsed || !parsed.isValid) return undefined;
    const count = parsed.params.length;
    return `${count} param${count !== 1 ? "s" : ""}`;
  })();

  const error = ((): string | undefined => {
    if (state.mode !== "parse" || !parsed) return undefined;
    return parsed.isValid ? undefined : parsed.error;
  })();

  const outputElement = ((): React.ReactNode | undefined => {
    if (state.mode !== "parse" || !parsed || !parsed.isValid) return undefined;
    return <ParsedOutput parsed={parsed} />;
  })();

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => setState((prev) => ({ ...prev, input: v }))}
      outputValue={outputValue}
      outputElement={outputElement}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      placeholder="Paste a URL to parse, encode, or decode..."
      actions={[
        { label: "Parse", onClick: () => setState((prev) => ({ ...prev, mode: "parse" as const })), active: state.mode === "parse" },
        { label: "Encode", onClick: () => setState((prev) => ({ ...prev, mode: "encode" as const })), active: state.mode === "encode" },
        { label: "Decode", onClick: () => setState((prev) => ({ ...prev, mode: "decode" as const })), active: state.mode === "decode" },
      ]}
      meta={meta}
      error={error}
    />
  );
}

const labelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";
const valueClass =
  "text-[13px] font-mono text-gray-800 dark:text-gray-200 break-all";

function ParsedOutput({
  parsed,
}: {
  parsed: Extract<ReturnType<typeof parseUrl>, { isValid: true }>;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <Row label="Protocol" value={parsed.protocol} />
      <Row label="Host" value={parsed.host} />
      <Row label="Path" value={parsed.pathname} />
      {parsed.hash && <Row label="Hash" value={parsed.hash} />}
      {parsed.params.length > 0 && (
        <div>
          <div className={labelClass}>Query Params</div>
          <div className="mt-1 flex flex-col gap-1">
            {parsed.params.map((p, i) => (
              <div key={i} className="flex gap-2 items-baseline">
                <span className="text-[13px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {p.key}
                </span>
                <span className="text-gray-400 dark:text-gray-500">=</span>
                <span className={valueClass}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <div className={labelClass}>{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}
