import { useState, useEffect, useCallback } from "react";
import { AppShell } from "./components/layout/AppShell";
import { CommandPalette } from "./components/layout/CommandPalette";
import { SettingsPanel } from "./components/layout/SettingsPanel";
import { tools } from "./tools/registry";
import { useClipboard } from "./hooks/useClipboard";
import { initTheme } from "./store/theme";
import "./App.css";

// Initialize theme on load
initTheme();

export function App(): React.ReactElement {
  const [activeToolId, setActiveToolId] = useState(tools[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

      if (e.metaKey && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((open) => !open);
        return;
      }

      if (e.metaKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const tool = tools.find((t) => t.shortcut === e.key);
        if (tool) setActiveToolId(tool.id);
        return;
      }

      if (e.key === "Escape") {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (paletteOpen) {
          setPaletteOpen(false);
        }
      }
    },
    [paletteOpen, settingsOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <AppShell
        activeToolId={activeToolId}
        onToolSelect={setActiveToolId}
        clipboardText={clipboardText}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={setActiveToolId}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
