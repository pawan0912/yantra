import { useSyncExternalStore } from "react";
import { getThemePreference, subscribeTheme, setThemePreference, getResolvedTheme } from "../store/theme";

type ThemePreference = "system" | "light" | "dark";

export function useTheme(): {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (pref: ThemePreference) => void;
} {
  const preference = useSyncExternalStore(subscribeTheme, getThemePreference);
  const resolved = useSyncExternalStore(subscribeTheme, getResolvedTheme);

  return { preference, resolved, setPreference: setThemePreference };
}
