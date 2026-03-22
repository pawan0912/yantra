import { useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { ToolPane } from "../../components/layout/ToolPane";
import { base64ToolAtoms } from "../../store/atoms";
import { encode, decode, isBase64Image, looksLikeBase64 } from "./base64.utils";
import type { ToolProps } from "../registry";

type Mode = "encode" | "decode";
type Variant = "standard" | "urlsafe";

const SAMPLE_DATA = "Hello, World! This is a sample text for Base64 encoding. \u{1F680}";

export function Base64Tool({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const [state, setState] = useAtom(base64ToolAtoms.stateAtom);
  const reset = useSetAtom(base64ToolAtoms.resetAtom);
  const [userSetMode, setUserSetMode] = useState(false);

  useEffect(() => {
    if (!userSetMode && state.input && looksLikeBase64({ input: state.input })) {
      setState((prev) => ({ ...prev, mode: "decode" as Mode }));
    }
  }, [state.input, userSetMode]);

  const handleModeChange = (v: string): void => {
    setState((prev) => ({ ...prev, mode: v as Mode }));
    setUserSetMode(true);
  };

  const { output, error } = (() => {
    if (!state.input.trim()) return { output: "", error: undefined };
    try {
      if (state.mode === "encode") {
        return { output: encode({ input: state.input, urlSafe: state.variant === "urlsafe" }), error: undefined };
      }
      return { output: decode({ input: state.input }), error: undefined };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "Invalid input" };
    }
  })();

  const imagePreview = (() => {
    if (state.mode !== "decode") return null;
    const check = isBase64Image({ input: state.input });
    if (check.isImage) return state.input;
    return null;
  })();

  const outputElement = imagePreview ? (
    <div className="p-3">
      <pre className="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all mb-3">
        {output}
      </pre>
      <div className="border border-gray-200/60 dark:border-white/[0.06] rounded-lg p-2">
        <img
          src={imagePreview}
          alt="Decoded base64 image"
          className="max-w-full max-h-48 object-contain"
        />
      </div>
    </div>
  ) : undefined;

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => setState((prev) => ({ ...prev, input: v }))}
      outputValue={output}
      outputElement={outputElement}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      placeholder="Paste text to encode or Base64 to decode..."
      mode={[
        {
          options: [
            { value: "encode", label: "Encode" },
            { value: "decode", label: "Decode" },
          ],
          value: state.mode,
          onChange: handleModeChange,
        },
        {
          options: [
            { value: "standard", label: "Standard" },
            { value: "urlsafe", label: "URL-safe" },
          ],
          value: state.variant,
          onChange: (v: string) => setState((prev) => ({ ...prev, variant: v as Variant })),
        },
      ]}
      error={error}
    />
  );
}
