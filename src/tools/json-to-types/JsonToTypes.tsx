import { useAtom, useSetAtom } from "jotai";
import { ToolPane } from "../../components/layout/ToolPane";
import { jsonToTypesToolAtoms } from "../../store/atoms";
import { jsonToTypeScript, jsonToZod, countFields } from "./json-to-types.utils";
import type { ToolProps } from "../registry";

type OutputMode = "typescript" | "zod";

const SAMPLE_DATA = '{"id": 1, "name": "John Doe", "email": "john@example.com", "isActive": true, "roles": ["admin", "user"], "profile": {"avatar": "https://example.com/avatar.png", "bio": null}}';

export function JsonToTypes({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [state, setState] = useAtom(jsonToTypesToolAtoms.stateAtom);
  const reset = useSetAtom(jsonToTypesToolAtoms.resetAtom);

  const result = (() => {
    const trimmed = state.input.trim();
    if (!trimmed) return { output: "", error: undefined, meta: undefined };

    try {
      const output =
        state.mode === "typescript"
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
  })();

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => setState((prev) => ({ ...prev, input: v }))}
      outputValue={result.output}
      sampleData={SAMPLE_DATA}
      outputElement={
        result.output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
            {result.output}
          </pre>
        ) : undefined
      }
      placeholder="Paste JSON to generate TypeScript types or Zod schemas..."
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      mode={{
        options: [
          { value: "typescript", label: "TypeScript" },
          { value: "zod", label: "Zod" },
        ],
        value: state.mode,
        onChange: (v) => setState((prev) => ({ ...prev, mode: v as OutputMode })),
      }}
      meta={result.meta}
      error={result.error}
    />
  );
}
