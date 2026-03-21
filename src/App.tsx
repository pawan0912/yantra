import { useState, useEffect, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { CommandPalette } from "./components/layout/CommandPalette";
import { tools } from "./tools/registry";
import { useClipboard } from "./hooks/useClipboard";
import "./App.css";

export function App(): React.ReactElement {
  const [activeToolId, setActiveToolId] = useState(tools[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { clipboardText, refresh } = useClipboard();

  useEffect(() => {
    const handleFocus = (): void => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.metaKey && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const tool = tools.find((t) => t.shortcut === e.key);
        if (tool) setActiveToolId(tool.id);
        return;
      }

      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    },
    [paletteOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <AppShell activeToolId={activeToolId} onToolSelect={setActiveToolId} clipboardText={clipboardText} />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={setActiveToolId}
      />
    </>
  );
}
