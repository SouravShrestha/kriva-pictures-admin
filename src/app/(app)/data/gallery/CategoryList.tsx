"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/actions/gallery";
import { categoryFolderFor, movedSlugs } from "@/lib/gallery";
import { slugify } from "@/lib/slug";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorBanner from "@/components/ErrorBanner";
import { useServerAction } from "@/components/useServerAction";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconFolder,
  IconArrowUp,
  IconArrowDown,
  IconChevronRight,
} from "@/components/icons";
import type { GalleryCategoryConfig } from "@/types/gallery";

export default function CategoryList({
  initialItems,
}: {
  initialItems: GalleryCategoryConfig[];
}) {
  const cats = initialItems;
  const { run, error, setError, isPending } = useServerAction();

  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<GalleryCategoryConfig | null>(null);

  const previewFolder = categoryFolderFor(slugify(draftName) || "<name>");

  const commitAdd = async () => {
    const ok = await run(() => addCategory({ name: draftName }));
    if (ok) {
      setAdding(false);
      setDraftName("");
    }
  };

  const commitRename = async (slug: string) => {
    const ok = await run(() => updateCategory(slug, { name: editName }));
    if (ok) setEditingSlug(null);
  };

  const move = (index: number, delta: -1 | 1) =>
    run(() => reorderCategories(movedSlugs(cats, index, delta)));

  return (
    <div className="space-y-3">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)} disabled={adding}>
          <IconPlus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {adding && (
        <div className="bg-surface-hover border border-border rounded-xl p-4 space-y-3">
          <Field label="Category name">
            <Input
              type="text"
              autoFocus
              value={draftName}
              placeholder="e.g. Newborn"
              onChange={(e) => setDraftName(e.target.value)}
            />
          </Field>
          <p className="text-xs text-text-subtle">
            Cloudinary folder{" "}
            <code className="bg-surface px-1 rounded border border-border font-mono">
              {previewFolder}
            </code>{" "}
            will be created. The folder path is fixed once created — renaming later only
            changes the display name.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={commitAdd} disabled={isPending || !draftName.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setDraftName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {cats.length === 0 && !adding && (
        <div className="text-sm text-text-subtle py-10 text-center border-2 border-dashed border-border rounded-xl">
          No categories yet. Add one to get started.
        </div>
      )}

      {cats.map((cat, i) => (
        <div key={cat.slug} className="bg-surface border border-border rounded-xl p-4">
          {editingSlug === cat.slug ? (
            <div className="space-y-3">
              <Field label="Category name">
                <Input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </Field>
              <p className="text-xs text-text-subtle">
                Folder stays at{" "}
                <code className="bg-surface-hover px-1 rounded border border-border font-mono">
                  {cat.cloudinaryFolder}
                </code>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => commitRename(cat.slug)} disabled={isPending}>
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
                {cat.cover ? (
                  <Image
                    src={cat.cover.secureUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <IconFolder className="w-5 h-5 text-text-subtle" aria-hidden="true" />
                )}
              </div>

              <Link href={`/data/gallery/${cat.slug}`} className="flex-1 min-w-0 group">
                <div className="text-sm font-medium text-text group-hover:text-accent transition-colors truncate">
                  {cat.name}
                </div>
                <div className="text-xs text-text-subtle mt-0.5 truncate">
                  <span className="font-mono">{cat.cloudinaryFolder}</span> ·{" "}
                  {cat.events.length} {cat.events.length === 1 ? "event" : "events"}
                </div>
              </Link>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  disabled={i === cats.length - 1 || isPending}
                  onClick={() => move(i, 1)}
                >
                  <IconArrowDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Rename category"
                  onClick={() => {
                    setEditingSlug(cat.slug);
                    setEditName(cat.name);
                  }}
                >
                  <IconPencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  aria-label="Delete category"
                  onClick={() => setPendingDelete(cat)}
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </Button>
                <Link
                  href={`/data/gallery/${cat.slug}`}
                  aria-label={`Open ${cat.name}`}
                  className="p-1.5 rounded-lg text-text-subtle hover:bg-surface-hover hover:text-text transition-colors"
                >
                  <IconChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}

      {pendingDelete && (
        <ConfirmDialog
          message={`Remove "${pendingDelete.name}" and its ${pendingDelete.events.length} event(s) from the gallery? The Cloudinary images are kept, so you can restore this by creating a category with the same name.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await run(() => deleteCategory(pendingDelete.slug));
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
