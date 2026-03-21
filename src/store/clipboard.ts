import { readText } from "@tauri-apps/plugin-clipboard-manager";

const MAX_HISTORY = 10;

let currentText = "";
let history: string[] = [];
let listeners: Array<() => void> = [];

function notify(): void {
  listeners.forEach((fn) => fn());
}

export async function readClipboard(): Promise<string> {
  try {
    const text = await readText();
    if (text && text !== currentText) {
      currentText = text;
      history = [text, ...history.filter((h) => h !== text)].slice(0, MAX_HISTORY);
      notify();
    }
    return currentText;
  } catch {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text !== currentText) {
        currentText = text;
        history = [text, ...history.filter((h) => h !== text)].slice(0, MAX_HISTORY);
        notify();
      }
      return currentText;
    } catch {
      return currentText;
    }
  }
}

export function getCurrentText(): string {
  return currentText;
}

export function getHistory(): string[] {
  return history;
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
