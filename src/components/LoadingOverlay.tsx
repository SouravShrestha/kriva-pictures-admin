"use client";

import { useLoading } from "@/components/LoadingProvider";

/** Full-screen overlay shown whenever the global loading state is active. */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function LoadingOverlay() {
  const { isLoading, progress } = useLoading();

  if (!isLoading) return null;

  const phaseLabel = progress?.phase === "uploading" ? "uploading" : "compressing";
  const ariaLabel = progress ? `${progress.percent}% ${phaseLabel}` : "Loading";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-bg/85"
    >
      <span className="loader" />
      {progress ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-text-muted">
            {progress.percent}% {phaseLabel}
          </span>
          {progress.total && progress.total > 1 && (
            <span className="text-xs text-text-subtle">
              {pad2(progress.current ?? 1)} of {pad2(progress.total)}
            </span>
          )}
        </div>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  );
}
