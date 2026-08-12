"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingProvider";

/**
 * Runs a server action with the global loading overlay, refreshes the route so
 * server-rendered data is re-read, and surfaces failures instead of letting
 * them bubble up as an unhandled error (the app has no toast system).
 */
export function useServerAction() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();

  const run = (fn: () => Promise<unknown>, options?: { refresh?: boolean }) =>
    new Promise<boolean>((resolve) => {
      setError(null);
      showLoading();
      startTransition(async () => {
        let ok = false;
        try {
          await fn();
          if (options?.refresh !== false) router.refresh();
          ok = true;
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
          hideLoading();
          resolve(ok);
        }
      });
    });

  return { run, error, setError, isPending };
}
