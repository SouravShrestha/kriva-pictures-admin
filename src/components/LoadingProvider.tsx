"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface LoadingProgress {
  /** Which step is running. Rendered as "<percent>% <phase>". */
  phase: "compressing" | "uploading";
  /** 0-100. */
  percent: number;
  /** 1-indexed position within a multi-file batch. Omit for single uploads. */
  current?: number;
  /** Total files in the current batch. Omit for single uploads. */
  total?: number;
}

interface LoadingContextValue {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  /** Wraps a promise, showing the overlay for its duration (ref-counted, safe to nest/overlap). */
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
  /** Optional progress readout shown below the spinner. `null` hides it. */
  progress: LoadingProgress | null;
  setProgress: (progress: LoadingProgress | null) => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

/** This "mounted?" value never changes after hydration, so there's nothing to subscribe to. */
function subscribeToNothing() {
  return () => {};
}

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  // Initial page load: show the overlay until the app has mounted client-side.
  // useSyncExternalStore lets us read "have we mounted?" without the extra
  // render pass a useEffect-driven state flip would cause.
  const initialLoad = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true
  );
  const [progress, setProgress] = useState<LoadingProgress | null>(null);

  const showLoading = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setCount((c) => {
      const next = Math.max(0, c - 1);
      // Once every caller has hidden the overlay, clear any stale progress
      // so the next unrelated loading spinner doesn't inherit it.
      if (next === 0) setProgress(null);
      return next;
    });
  }, []);

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      showLoading();
      try {
        return await promise;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading: initialLoad || count > 0,
        showLoading,
        hideLoading,
        withLoading,
        progress,
        setProgress,
      }}
    >
      <Suspense fallback={null}>
        <NavigationLoadingListener showLoading={showLoading} hideLoading={hideLoading} />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Toggles the overlay briefly whenever the route (pathname or search params) changes,
 * giving feedback for client-side navigations between pages.
 */
function NavigationLoadingListener({
  showLoading,
  hideLoading,
}: {
  showLoading: () => void;
  hideLoading: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (previousKey.current === null) {
      // Skip the very first render — the initial-load overlay already covers this.
      previousKey.current = key;
      return;
    }
    if (previousKey.current === key) return;
    previousKey.current = key;

    showLoading();
    // The new route's content is already committed by the time this effect runs,
    // so a short delay is enough to bridge the visual transition.
    const timeout = setTimeout(hideLoading, 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams, showLoading, hideLoading]);

  return null;
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within a LoadingProvider");
  return ctx;
}
