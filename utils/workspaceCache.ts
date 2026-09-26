type ClearFn = () => void;

let clearer: ClearFn | null = null;

/** Register React Query (or other) cache clearer for workspace switches. */
export function registerWorkspaceCacheClearer(fn: ClearFn): () => void {
  clearer = fn;
  return () => {
    if (clearer === fn) clearer = null;
  };
}

export function clearWorkspaceCaches(): void {
  clearer?.();
}
