import { useState, useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { jsonToTypeScript, jsonToZod, countFields } from "./json-to-types.utils";
import type { ToolProps } from "../registry";

type OutputMode = "typescript" | "zod";

export function JsonToTypes({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<OutputMode>("typescript");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { output: "", error: undefined, meta: undefined };

    try {
      const output =
        mode === "typescript"
          ? jsonToTypeScript({ input: trimmed })
          : jsonToZod({ input: trimmed });
      const fields = countFields({ input: trimmed });
      return { output, error: undefined, meta: `${fields} field${fields === 1 ? "" : "s"} found` };
    } catch (e) {
      return {
        output: "",
        error: e instanceof Error ? e.message : "Invalid JSON",
        meta: undefined,
      };
    }
  }, [input, mode]);

  return (
    <ToolPane
      inputValue={input}
      onInputChange={setInput}
      outputValue={result.output}
      outputElement={
        result.output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
            {result.output}
          </pre>
        ) : undefined
      }
      placeholder='{"id": 1, "name": "John", "email": "john@example.com"}'
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      actions={[
        { label: "TypeScript", onClick: () => setMode("typescript"), active: mode === "typescript" },
        { label: "Zod", onClick: () => setMode("zod"), active: mode === "zod" },
      ]}
      meta={result.meta}
      error={result.error}
    />
  );
}
