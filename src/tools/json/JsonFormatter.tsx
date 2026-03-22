import { useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ToolPane } from "../../components/layout/ToolPane";
import { jsonToolAtoms } from "../../store/atoms";
import { formatJson, minifyJson, validateJson, getJsonMeta, highlightJson } from "./json.utils";
import type { ToolProps } from "../registry";

const SAMPLE_DATA = '{"name": "John Doe", "age": 30, "email": "john@example.com", "address": {"city": "San Francisco", "state": "CA"}, "hobbies": ["coding", "hiking", "photography"]}';

export function JsonFormatter({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [state, setState] = useAtom(jsonToolAtoms.stateAtom);
  const reset = useSetAtom(jsonToolAtoms.resetAtom);

  const validation = useMemo(() => {
    if (!state.input.trim()) return null;
    return validateJson({ input: state.input });
  }, [state.input]);

  const meta = useMemo(() => {
    if (!state.input.trim() || !validation?.valid) return undefined;
    try {
      const m = getJsonMeta({ input: state.input });
      return `Valid · ${m.keyCount} keys · depth ${m.maxDepth}`;
    } catch {
      return undefined;
    }
  }, [state.input, validation]);

  const highlighted = useMemo(() => {
    if (!state.output) return null;
    return highlightJson({ json: state.output });
  }, [state.output]);

  const handleFormat = (): void => {
    try {
      setState((prev) => ({ ...prev, output: formatJson({ input: state.input }) }));
    } catch {
      setState((prev) => ({ ...prev, output: "" }));
    }
  };

  const handleMinify = (): void => {
    try {
      setState((prev) => ({ ...prev, output: minifyJson({ input: state.input }) }));
    } catch {
      setState((prev) => ({ ...prev, output: "" }));
    }
  };

  const error = state.input.trim() && validation && !validation.valid ? validation.error : undefined;

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => setState((prev) => ({ ...prev, input: v }))}
      outputValue={state.output}
      sampleData={SAMPLE_DATA}
      outputElement={
        highlighted ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : undefined
      }
      placeholder="Paste JSON to format or minify..."
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      actions={[
        { label: "Format", onClick: handleFormat },
        { label: "Minify", onClick: handleMinify },
      ]}
      meta={meta}
      error={error}
    />
  );
}
