"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  message: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-text mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            variant="danger"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm();
              setLoading(false);
            }}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
