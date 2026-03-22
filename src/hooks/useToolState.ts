import { useState, useCallback } from "react";

/**
 * In-memory store for tool state. Keyed by tool ID.
 * Survives component unmount/remount (tool switching).
 * Cleared on app quit (no localStorage).
 */
const store = new Map<string, Record<string, unknown>>();

type UseToolStateReturn<T> = {
  state: T;
  update: (partial: Partial<T>) => void;
  reset: () => void;
};

export function useToolState<T extends Record<string, unknown>>({
  toolId,
  initial,
}: {
  toolId: string;
  initial: T;
}): UseToolStateReturn<T> {
  // Initialize from store or use defaults
  const [state, setState] = useState<T>(() => {
    const stored = store.get(toolId);
    return stored ? ({ ...initial, ...stored } as T) : initial;
  });

  const update = useCallback(
    (partial: Partial<T>): void => {
      setState((prev) => {
        const next = { ...prev, ...partial };
        store.set(toolId, next as Record<string, unknown>);
        return next;
      });
    },
    [toolId]
  );

  const reset = useCallback((): void => {
    store.delete(toolId);
    setState(initial);
  }, [toolId, initial]);

  return { state, update, reset };
}
