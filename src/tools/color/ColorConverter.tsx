import { useState, useMemo } from "react";
import { ToolPane } from "../../components/layout/ToolPane";
import { useToolState } from "../../hooks/useToolState";
import { parseColor, getAllFormats, detectColorFormat, toHex } from "./color.utils";
import type { ToolProps } from "../registry";

function CopyIndicator({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const handleCopy = (): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const SAMPLE_DATA = "#3b82f6";

export function ColorConverter({ clipboardText, clipboardMatch }: ToolProps): React.ReactElement {
  const { state, update, reset } = useToolState({
    toolId: "color",
    initial: { input: "" },
  });

  const parsed = useMemo(() => {
    if (!state.input.trim()) return null;
    return parseColor({ input: state.input });
  }, [state.input]);

  const color = useMemo(() => {
    if (!parsed || !parsed.isValid) return null;
    const formats = getAllFormats(parsed);
    const hex = toHex(parsed);
    const cssVar = `--color-custom: ${formats.hex};`;
    const twArbitrary = `text-[${formats.hex}]`;
    const rnStyle = `color: '${formats.hex}'`;
    return { formats, hex, cssVar, twArbitrary, rnStyle };
  }, [parsed]);

  const detectedFormat = useMemo(() => {
    if (!state.input.trim()) return "";
    return detectColorFormat({ input: state.input });
  }, [state.input]);

  const error = parsed && !parsed.isValid ? parsed.error : undefined;

  const outputElement = color ? (
    <div className="space-y-4 text-[13px]">
      <div
        className="w-full h-20 rounded-lg border border-gray-200/60 dark:border-white/[0.08] shadow-inner"
        style={{ backgroundColor: color.hex }}
      />

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Formats</p>
        {(["hex", "rgb", "hsl"] as const).map((key) => (
          <div key={key} className="flex items-center gap-2 font-mono text-gray-700 dark:text-gray-300">
            <span className="w-8 text-[10px] uppercase text-gray-400 dark:text-gray-500">{key}</span>
            <span className="flex-1 select-all">{color.formats[key]}</span>
            <CopyIndicator text={color.formats[key]} />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Copy as</p>
        {[
          { label: "CSS var", value: color.cssVar },
          { label: "Tailwind", value: color.twArbitrary },
          { label: "RN Style", value: color.rnStyle },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 font-mono text-gray-700 dark:text-gray-300">
            <span className="w-16 text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{item.label}</span>
            <span className="flex-1 select-all truncate">{item.value}</span>
            <CopyIndicator text={item.value} />
          </div>
        ))}
      </div>
    </div>
  ) : undefined;

  const meta = detectedFormat && detectedFormat !== "unknown"
    ? `Detected: ${detectedFormat.toUpperCase()}`
    : undefined;

  return (
    <ToolPane
      inputValue={state.input}
      onInputChange={(v: string) => update({ input: v })}
      outputValue={color ? color.formats.hex : ""}
      outputElement={outputElement}
      sampleData={SAMPLE_DATA}
      clipboardText={clipboardText}
      clipboardMatch={clipboardMatch}
      onClear={reset}
      placeholder="Paste a color value (hex, rgb, or hsl)..."
      actions={[{ label: "Parse", onClick: () => update({ input: state.input }) }]}
      meta={meta}
      error={error}
    />
  );
}
