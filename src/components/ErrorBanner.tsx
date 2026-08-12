"use client";

import { IconX } from "@/components/icons";

/** Inline failure message for server-action errors. */
export default function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 rounded p-0.5 hover:bg-danger/15 transition-colors"
        >
          <IconX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
