import { useState, useMemo, useEffect, useRef } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { formatJson, minifyJson, validateJson, getJsonMeta, highlightJson } from "./json.utils";
import type { ToolProps } from "../registry";

export function JsonFormatter({ clipboardText }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const hasUserTyped = useRef(false);

  useEffect(() => {
    if (clipboardText && !hasUserTyped.current && !input) {
      const trimmed = clipboardText.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        setInput(clipboardText);
      }
    }
  }, [clipboardText, input]);

  const handleInputChange = (value: string): void => {
    hasUserTyped.current = true;
    setInput(value);
  };

  const validation = useMemo(() => {
    if (!input.trim()) return null;
    return validateJson({ input });
  }, [input]);

  const meta = useMemo(() => {
    if (!input.trim() || !validation?.valid) return undefined;
    try {
      const m = getJsonMeta({ input });
      return `Valid · ${m.keyCount} keys · depth ${m.maxDepth}`;
    } catch {
      return undefined;
    }
  }, [input, validation]);

  const highlighted = useMemo(() => {
    if (!output) return null;
    return highlightJson({ json: output });
  }, [output]);

  const handleFormat = (): void => {
    try {
      setOutput(formatJson({ input }));
    } catch {
      setOutput("");
    }
  };

  const handleMinify = (): void => {
    try {
      setOutput(minifyJson({ input }));
    } catch {
      setOutput("");
    }
  };

  const error = input.trim() && validation && !validation.valid ? validation.error : undefined;

  return (
    <ToolPane
      inputValue={input}
      onInputChange={handleInputChange}
      outputValue={output}
      outputElement={
        highlighted ? (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : undefined
      }
      placeholder='{"name": "value", "count": 42}'
      actions={[
        { label: "Format", onClick: handleFormat },
        { label: "Minify", onClick: handleMinify },
      ]}
      meta={meta}
      error={error}
    />
  );
}
