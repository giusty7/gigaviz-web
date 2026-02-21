"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-safe mount check using useSyncExternalStore.
 *
 * Returns `false` during SSR and `true` after hydration on the client.
 * Use this hook to guard browser-only UI that would cause hydration
 * mismatches if rendered on the server (e.g. animations, localStorage reads).
 *
 * @example
 * ```tsx
 * const hydrated = useHydrated();
 * if (!hydrated) return <Skeleton />;
 * return <AnimatedDashboard />;
 * ```
 */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

/** @deprecated Use `useHydrated()` instead. Kept for backward compatibility. */
export { emptySubscribe, getClientSnapshot, getServerSnapshot };
