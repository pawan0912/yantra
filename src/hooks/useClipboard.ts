import { useEffect, useSyncExternalStore } from "react";
import { getCurrentText, subscribe, readClipboard } from "../store/clipboard";

export function useClipboard(): { clipboardText: string; refresh: () => Promise<string> } {
  const clipboardText = useSyncExternalStore(subscribe, getCurrentText);

  useEffect(() => {
    readClipboard();
  }, []);

  return { clipboardText, refresh: readClipboard };
}
