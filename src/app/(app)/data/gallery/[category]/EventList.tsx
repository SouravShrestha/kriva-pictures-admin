"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  addEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
  setCategoryCover,
} from "@/actions/gallery";
import { movedSlugs } from "@/lib/gallery";
import { slugify } from "@/lib/slug";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorBanner from "@/components/ErrorBanner";
import { useServerAction } from "@/components/useServerAction";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconImage,
  IconArrowUp,
  IconArrowDown,
  IconChevronRight,
  IconStar,
} from "@/components/icons";
import type { GalleryCategoryConfig, GalleryEventConfig } from "@/types/gallery";

const emptyDraft = { name: "", date: "" };

/** Today's date as DD-MM-YYYY, matching the format used throughout this form. */
function todayFormatted(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export default function EventList({ category }: { category: GalleryCategoryConfig }) {
  const events = category.events;
  const { run, error, setError, isPending } = useServerAction();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<GalleryEventConfig | null>(null);

  const previewFolder = `${category.cloudinaryFolder}/${slugify(draft.name) || "<name>"}`;

  const commitAdd = async () => {
    const ok = await run(() => addEvent(category.slug, draft));
    if (ok) {
      setAdding(false);
      setDraft(emptyDraft);
    }
  };

  const commitEdit = async (slug: string) => {
    const ok = await run(() => updateEvent(category.slug, slug, editDraft));
    if (ok) setEditingSlug(null);
  };

  const move = (index: number, delta: -1 | 1) =>
    run(() => reorderEvents(category.slug, movedSlugs(events, index, delta)));

  const useAsCategoryCover = (ev: GalleryEventConfig) =>
    run(() => setCategoryCover(category.slug, ev.cover ?? null));

  return (
    <div className="space-y-3">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setDraft((d) => ({ ...d, date: d.date || todayFormatted() }));
            setAdding(true);
          }}
          disabled={adding}
        >
          <IconPlus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {adding && (
        <div className="bg-surface-hover border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Event name">
              <Input
                type="text"
                autoFocus
                value={draft.name}
                placeholder="e.g. Shailza"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </Field>
            <Field label="Date (DD-MM-YYYY)">
              <Input
                type="text"
                value={draft.date}
                placeholder="12-08-2026"
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </Field>
          </div>
          <p className="text-xs text-text-subtle">
            Cloudinary folder{" "}
            <code className="bg-surface px-1 rounded border border-border font-mono">
              {previewFolder}
            </code>{" "}
            will be created.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={commitAdd} disabled={isPending || !draft.name.trim()}>
              {isPending ? "Creating folder…" : "Create"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setDraft(emptyDraft);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {events.length === 0 && !adding && (
        <div className="text-sm text-text-subtle py-10 text-center border-2 border-dashed border-border rounded-xl">
          No events in this category yet.
        </div>
      )}

      {events.map((ev, i) => {
        const href = `/data/gallery/${category.slug}/${ev.slug}`;
        const isCategoryCover =
          !!ev.cover && category.cover?.publicId === ev.cover.publicId;

        return (
          <div key={ev.slug} className="bg-surface border border-border rounded-xl p-4">
            {editingSlug === ev.slug ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Event name">
                    <Input
                      type="text"
                      autoFocus
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  </Field>
                  <Field label="Date (DD-MM-YYYY)">
                    <Input
                      type="text"
                      value={editDraft.date}
                      onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                    />
                  </Field>
                </div>
                <p className="text-xs text-text-subtle">
                  Folder stays at{" "}
                  <code className="bg-surface-hover px-1 rounded border border-border font-mono">
                    {ev.folder ?? `${category.cloudinaryFolder}/${ev.slug}`}
                  </code>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => commitEdit(ev.slug)} disabled={isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSlug(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-border bg-surface-hover flex items-center justify-center">
                  {ev.cover ? (
                    <Image
                      src={ev.cover.secureUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <IconImage className="w-5 h-5 text-text-subtle" aria-hidden="true" />
                  )}
                </div>

                <Link href={href} className="flex-1 min-w-0 group">
                  <div className="text-sm font-medium text-text group-hover:text-accent transition-colors truncate">
                    {ev.name}
                    {isCategoryCover && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent align-middle">
                        <IconStar className="w-3 h-3" aria-hidden="true" /> Category cover
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-subtle mt-0.5 truncate">
                    {ev.date || "No date"} · <span className="font-mono">{ev.slug}</span>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ev.cover && !isCategoryCover && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => useAsCategoryCover(ev)}
                      aria-label={`Use ${ev.name}'s cover as the category cover`}
                      title="Use this event's cover as the category cover"
                    >
                      <IconStar className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={i === 0 || isPending}
                    onClick={() => move(i, -1)}
                  >
                    <IconArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={i === events.length - 1 || isPending}
                    onClick={() => move(i, 1)}
                  >
                    <IconArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Edit event"
                    onClick={() => {
                      setEditingSlug(ev.slug);
                      setEditDraft({ name: ev.name, date: ev.date });
                    }}
                  >
                    <IconPencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label="Delete event"
                    onClick={() => setPendingDelete(ev)}
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </Button>
                  <Link
                    href={href}
                    aria-label={`Open ${ev.name}`}
                    className="p-1.5 rounded-lg text-text-subtle hover:bg-surface-hover hover:text-text transition-colors"
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {pendingDelete && (
        <ConfirmDialog
          message={`Remove "${pendingDelete.name}" from this category? The Cloudinary images are kept — delete them from the event page if you want them gone.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await run(() => deleteEvent(category.slug, pendingDelete.slug));
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
