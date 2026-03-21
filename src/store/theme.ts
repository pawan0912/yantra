type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "yantra-theme";

let preference: ThemePreference = (localStorage.getItem(STORAGE_KEY) as ThemePreference) || "system";
let listeners: Array<() => void> = [];

function notify(): void {
  listeners.forEach((fn) => fn());
}

function applyTheme(pref: ThemePreference): void {
  const root = document.documentElement;
  if (pref === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  } else {
    root.classList.toggle("dark", pref === "dark");
  }
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function setThemePreference(pref: ThemePreference): void {
  preference = pref;
  localStorage.setItem(STORAGE_KEY, pref);
  applyTheme(pref);
  notify();
}

export function getResolvedTheme(): "light" | "dark" {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

export function subscribeTheme(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function initTheme(): void {
  applyTheme(preference);

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (preference === "system") {
      applyTheme("system");
      notify();
    }
  });
}
