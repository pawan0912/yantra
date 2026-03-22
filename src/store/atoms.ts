import { atom } from "jotai";
import type { DiffLine } from "../tools/diff/diff.utils";

/**
 * Factory to create a pair of atoms for tool input/output state.
 * Each tool gets isolated atoms that survive component unmount.
 * Migration path: swap `atom()` → `atomWithStorage()` for persistence.
 */
export function createToolAtoms<T extends Record<string, unknown>>({ initial }: { initial: T }): {
  stateAtom: ReturnType<typeof atom<T>>;
  resetAtom: ReturnType<typeof atom<null, [], void>>;
} {
  const stateAtom = atom<T>(initial);

  const resetAtom = atom(null, (_get, set) => {
    set(stateAtom, initial);
  });

  return { stateAtom, resetAtom };
}

// ── Global app state ──

export const activeToolIdAtom = atom("json");
export const sidebarOpenAtom = atom(true);
export const paletteOpenAtom = atom(false);
export const showSettingsAtom = atom(false);

// ── Per-tool state atoms ──

export const jsonToolAtoms = createToolAtoms({
  initial: { input: "", output: "" },
});

export const diffToolAtoms = createToolAtoms({
  initial: { oldText: "", newText: "", lines: null as DiffLine[] | null },
});

export const jsonToTypesToolAtoms = createToolAtoms({
  initial: { input: "", mode: "typescript" as "typescript" | "zod" },
});

export const jwtToolAtoms = createToolAtoms({
  initial: { input: "" },
});

export const curlToolAtoms = createToolAtoms({
  initial: { input: "", format: "fetch" as "fetch" | "axios" | "reactQuery" },
});

export const regexToolAtoms = createToolAtoms({
  initial: { pattern: "", flags: "g", testString: "", output: "" },
});

export const urlToolAtoms = createToolAtoms({
  initial: { input: "", output: "", mode: "parse" as "parse" | "encode" | "decode" },
});

export const timestampToolAtoms = createToolAtoms({
  initial: { input: "", output: "" },
});

export const base64ToolAtoms = createToolAtoms({
  initial: { input: "", output: "", mode: "encode" as "encode" | "decode", variant: "standard" as "standard" | "urlsafe" },
});

export const colorToolAtoms = createToolAtoms({
  initial: { input: "", output: "" },
});
