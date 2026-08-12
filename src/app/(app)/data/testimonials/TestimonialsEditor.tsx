"use client";

import { useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { saveTestimonials, uploadTestimonialImage } from "@/actions/testimonials";
import { useLoading } from "@/components/LoadingProvider";
import Button from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { IconPlus, IconTrash, IconPencil, IconUpload } from "@/components/icons";
import type { Testimonial } from "@/types/testimonials";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { withSimulatedProgress } from "@/lib/upload-progress";

const empty = (): Testimonial => ({
  id: crypto.randomUUID().slice(0, 8),
  heading: "", details: "", name: "", occasion: "", date: "", image_url: "",
});

function TestimonialField({
  itemKey,
  label,
  multiline = false,
  draft,
  setDraft,
}: {
  itemKey: keyof Testimonial;
  label: string;
  multiline?: boolean;
  draft: Testimonial;
  setDraft: Dispatch<SetStateAction<Testimonial>>;
}) {
  return (
    <Field label={label}>
      {multiline ? (
        <Textarea
          rows={3}
          value={(draft[itemKey] as string) ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, [itemKey]: e.target.value }))}
        />
      ) : (
        <Input
          type="text"
          value={(draft[itemKey] as string) ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, [itemKey]: e.target.value }))}
        />
      )}
    </Field>
  );
}

function TestimonialImageField({
  draft,
  setDraft,
}: {
  draft: Testimonial;
  setDraft: Dispatch<SetStateAction<Testimonial>>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showLoading, hideLoading, setProgress } = useLoading();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setError(null);
    setUploading(true);
    showLoading();
    try {
      const dataUrl = await compressImageToDataUrl(file, {}, (percent) => {
        setProgress({ phase: "compressing", percent });
      });
      const asset = await withSimulatedProgress(
        () => uploadTestimonialImage(dataUrl, draft.id),
        (percent) => setProgress({ phase: "uploading", percent }),
      );
      setDraft((d) => ({ ...d, image_url: `${asset.secureUrl}?v=${Date.now()}` }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      setProgress(null);
      hideLoading();
    }
  };

  return (
    <Field label="Image *">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {draft.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-text-subtle">No image</span>
          )}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={uploading} />
          <Button size="sm" variant="outline" type="button" disabled={uploading} onClick={(e) => {
            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
          }}>
            <IconUpload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : draft.image_url ? "Replace" : "Upload"}
          </Button>
        </label>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {!draft.image_url && !error && (
        <p className="text-xs text-text-subtle mt-1">Required — upload a photo for this testimonial.</p>
      )}
    </Field>
  );
}

function TestimonialForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  draft: Testimonial;
  setDraft: Dispatch<SetStateAction<Testimonial>>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="bg-surface-hover border border-border rounded-xl p-4 space-y-3">
      <TestimonialImageField draft={draft} setDraft={setDraft} />
      <TestimonialField itemKey="heading" label="Heading" draft={draft} setDraft={setDraft} />
      <TestimonialField itemKey="details" label="Details" multiline draft={draft} setDraft={setDraft} />
      <TestimonialField itemKey="name" label="Name" draft={draft} setDraft={setDraft} />
      <TestimonialField itemKey="occasion" label="Occasion" draft={draft} setDraft={setDraft} />
      <TestimonialField itemKey="date" label="Date" draft={draft} setDraft={setDraft} />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={isPending}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function TestimonialsEditor({ initialItems }: { initialItems: Testimonial[] }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Testimonial>(empty());
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const save = (updated: Testimonial[]) => {
    setItems(updated);
    showLoading();
    startTransition(async () => {
      try {
        await saveTestimonials(updated);
      } finally {
        hideLoading();
      }
    });
  };

  const startEdit = (i: number) => {
    setEditing(i);
    // Legacy items (saved before `id` was required) may lack it — backfill so the
    // image upload has a stable tag to overwrite on subsequent replaces.
    setDraft({ ...items[i], id: items[i].id || crypto.randomUUID().slice(0, 8) });
    setFormError(null);
  };
  const cancelEdit = () => { setEditing(null); setDraft(empty()); setFormError(null); };

  const commitEdit = () => {
    if (!draft.image_url) { setFormError("Image is required."); return; }
    const updated = items.map((t, i) => (i === editing ? draft : t));
    save(updated);
    setEditing(null);
    setFormError(null);
  };

  const startAdd = () => { setAdding(true); setDraft(empty()); setFormError(null); };
  const commitAdd = () => {
    if (!draft.image_url) { setFormError("Image is required."); return; }
    save([...items, draft]);
    setAdding(false);
    setDraft(empty());
    setFormError(null);
  };

  const remove = (i: number) => {
    if (!window.confirm("Delete this testimonial?")) return;
    save(items.filter((_, idx) => idx !== i));
  };

  const cancelAdd = () => { setAdding(false); setFormError(null); };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={startAdd} disabled={adding}>
          <IconPlus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {adding && (
        <TestimonialForm
          draft={draft}
          setDraft={setDraft}
          onSave={commitAdd}
          onCancel={cancelAdd}
          isPending={isPending}
          error={formError}
        />
      )}

      {items.map((item, i) => (
        <div key={item.id ?? i} className="bg-surface border border-border rounded-xl p-4">
          {editing === i ? (
            <TestimonialForm
              draft={draft}
              setDraft={setDraft}
              onSave={commitEdit}
              onCancel={cancelEdit}
              isPending={isPending}
              error={formError}
            />
          ) : (
            <div className="flex items-start gap-4">
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-text">{item.heading}</div>
                <div className="text-xs text-text-muted mt-0.5">{item.name} · {item.occasion}</div>
                <div className="text-xs text-text-subtle mt-1 line-clamp-2">{item.details}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={() => startEdit(i)}>
                  <IconPencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(i)}>
                  <IconTrash className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {items.length === 0 && !adding && (
        <div className="text-center py-12 text-text-subtle text-sm border-2 border-dashed border-border rounded-xl">
          No testimonials yet.
        </div>
      )}
    </div>
  );
}
