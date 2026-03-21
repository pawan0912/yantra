import { useState, useMemo, useEffect, useRef } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { Toggle } from "../../components/ui/Toggle";
import { encode, decode, isBase64Image, looksLikeBase64 } from "./base64.utils";
import type { ToolProps } from "../registry";

type Mode = "encode" | "decode";
type Variant = "standard" | "urlsafe";

export function Base64Tool({ clipboardText }: ToolProps): React.ReactElement {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Variant>("standard");
  const [userSetMode, setUserSetMode] = useState(false);
  const hasUserTyped = useRef(false);

  useEffect(() => {
    if (clipboardText && !hasUserTyped.current && !input) {
      setInput(clipboardText);
    }
  }, [clipboardText, input]);

  const handleInputChange = (value: string): void => {
    hasUserTyped.current = true;
    setInput(value);
  };

  useEffect(() => {
    if (!userSetMode && input && looksLikeBase64({ input })) {
      setMode("decode");
    }
  }, [input, userSetMode]);

  const handleModeChange = (v: string): void => {
    setMode(v as Mode);
    setUserSetMode(true);
  };

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: undefined };
    try {
      if (mode === "encode") {
        return { output: encode({ input, urlSafe: variant === "urlsafe" }), error: undefined };
      }
      return { output: decode({ input }), error: undefined };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid input" };
    }
  }, [input, mode, variant]);

  const imagePreview = useMemo(() => {
    if (mode !== "decode") return null;
    const check = isBase64Image({ input });
    if (check.isImage) return input;
    return null;
  }, [mode, input]);

  const outputElement = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Toggle
          options={[
            { label: "Encode", value: "encode" },
            { label: "Decode", value: "decode" },
          ]}
          value={mode}
          onChange={handleModeChange}
        />
        <Toggle
          options={[
            { label: "Standard", value: "standard" },
            { label: "URL-safe", value: "urlsafe" },
          ]}
          value={variant}
          onChange={(v) => setVariant(v as Variant)}
        />
      </div>
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">
          {output}
        </pre>
        {imagePreview && (
          <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded p-2">
            <img
              src={imagePreview}
              alt="Decoded base64 image"
              className="max-w-full max-h-48 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolPane
      inputValue={input}
      onInputChange={handleInputChange}
      outputValue={output}
      outputElement={outputElement}
      actions={[]}
      error={error}
    />
  );
}
