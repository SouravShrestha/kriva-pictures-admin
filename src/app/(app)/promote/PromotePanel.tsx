"use client";

import { useState, useTransition } from "react";
import { promoteSelected } from "@/actions/promote";
import type { PromoteKey } from "@/actions/promote";
import DiffBadge from "@/components/DiffBadge";
import Button from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import { useLoading } from "@/components/LoadingProvider";

const ENTITIES: { key: PromoteKey; label: string; desc: string }[] = [
  { key: "banners-home", label: "Home Banner", desc: "Slideshow images + ordering" },
  { key: "banners-footer", label: "Footer Gallery", desc: "Footer gallery images + ordering" },
  { key: "banners-gallery", label: "Gallery Banner", desc: "Gallery page banner images + ordering" },
  { key: "sections", label: "Section Images", desc: "Fixed section image slots" },
  { key: "testimonials", label: "Testimonials", desc: "KV: testimonials" },
  { key: "packages", label: "Packages", desc: "KV: packages" },
  { key: "faqs", label: "FAQs", desc: "KV: faqs" },
  { key: "gallery", label: "Gallery", desc: "KV: gallery categories + events" },
];

export default function PromotePanel({ diffs }: { diffs: Record<PromoteKey, number> }) {
  const [selected, setSelected] = useState<Set<PromoteKey>>(new Set());
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const toggle = (key: PromoteKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handlePromote = () => {
    showLoading();
    startTransition(async () => {
      try {
        await promoteSelected(Array.from(selected) as PromoteKey[]);
        setDone(true);
        setSelected(new Set());
      } finally {
        hideLoading();
      }
    });
  };

  if (done) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <IconCheck className="w-6 h-6" />
        </div>
        <div className="font-semibold text-emerald-700 dark:text-emerald-400">Promotion complete!</div>
        <div className="text-sm text-emerald-600/80 dark:text-emerald-400/70 mt-1">Changes are now live on production.</div>
        <Button className="mt-4" variant="outline" onClick={() => setDone(false)}>Back</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
        <div className="hidden sm:grid px-5 py-3 bg-surface-hover border-b border-border grid-cols-3 text-xs font-medium text-text-muted">
          <span>Entity</span><span>Changes</span><span>Description</span>
        </div>
        {ENTITIES.map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex items-start sm:items-center gap-3 sm:gap-0 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(key)}
              onChange={() => toggle(key)}
              className="mt-0.5 sm:mt-0 sm:mr-4 accent-accent w-4 h-4 shrink-0"
            />
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 min-w-0">
              <span className="sm:flex-1 text-sm font-medium text-text">{label}</span>
              <span className="sm:flex-1">
                <DiffBadge count={diffs[key]} />
              </span>
              <span className="sm:flex-1 text-xs text-text-subtle">{desc}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handlePromote}
          disabled={selected.size === 0 || isPending}
        >
          {isPending ? "Promoting…" : `Promote ${selected.size > 0 ? `(${selected.size})` : ""}`}
        </Button>
        {selected.size > 0 && (
          <span className="text-xs text-text-subtle">{selected.size} item{selected.size > 1 ? "s" : ""} selected</span>
        )}
      </div>
    </div>
  );
}
