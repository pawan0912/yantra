import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppShell } from "./components/layout/AppShell";
import { CommandPalette } from "./components/layout/CommandPalette";
import { tools } from "./tools/registry";
import { useClipboard } from "./hooks/useClipboard";
import { initTheme } from "./store/theme";
import "./App.css";

// Initialize theme on load
initTheme();

export function App(): React.ReactElement {
  const [activeToolId, setActiveToolId] = useState(tools[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { clipboardText, refresh } = useClipboard();

  useEffect(() => {
    const handleFocus = (): void => {
      refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  // Listen for Settings triggered from native app menu (Yantra > Settings / Cmd+,)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("menu-settings", () => {
      setShowSettings(true);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  // When selecting a tool, exit settings view
  const handleToolSelect = (toolId: string): void => {
    setActiveToolId(toolId);
    setShowSettings(false);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.metaKey && e.key === "k") {
      e.preventDefault();
      setPaletteOpen((open) => !open);
      return;
    }

    if (e.metaKey && ((e.key >= "1" && e.key <= "9") || e.key === "0")) {
      e.preventDefault();
      const tool = tools.find((t) => t.shortcut === e.key);
      if (tool) handleToolSelect(tool.id);
      return;
    }

    if (e.key === "Escape" && paletteOpen) {
      setPaletteOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <AppShell
        activeToolId={activeToolId}
        onToolSelect={handleToolSelect}
        clipboardText={clipboardText}
        showSettings={showSettings}
        onSettingsToggle={() => setShowSettings((s) => !s)}
      />
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleToolSelect}
      />
    </>
  );
}
