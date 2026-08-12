"use client";

import { useState, useTransition, type Dispatch, type SetStateAction } from "react";
import { savePackages, uploadPackageImage } from "@/actions/packages";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { IconPlus, IconTrash, IconPencil, IconX, IconUpload } from "@/components/icons";
import type { Package, PackageInclude } from "@/types/packages";
import { useLoading } from "@/components/LoadingProvider";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { withSimulatedProgress } from "@/lib/upload-progress";

const emptyPkg = (): Package => ({
  id: crypto.randomUUID().slice(0, 8),
  name: "", ideal_for: "", includes: [], price_aud: 0, tag: "", image: "",
});

function PackageImageField({
  draft,
  setDraft,
}: {
  draft: Package;
  setDraft: Dispatch<SetStateAction<Package>>;
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
        () => uploadPackageImage(dataUrl, draft.id),
        (percent) => setProgress({ phase: "uploading", percent }),
      );
      setDraft((d) => ({ ...d, image: `${asset.secureUrl}?v=${Date.now()}` }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      setProgress(null);
      hideLoading();
    }
  };

  return (
    <Field label="Image">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {draft.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image} alt="" className="w-full h-full object-cover" />
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
            {uploading ? "Uploading..." : draft.image ? "Replace" : "Upload"}
          </Button>
        </label>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </Field>
  );
}

function PackageForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
}: {
  draft: Package;
  setDraft: Dispatch<SetStateAction<Package>>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const addInclude = () =>
    setDraft((d) => ({ ...d, includes: [...d.includes, { icon: "", text: "" }] }));
  const removeInclude = (i: number) =>
    setDraft((d) => ({ ...d, includes: d.includes.filter((_, idx) => idx !== i) }));
  const updateInclude = (i: number, field: keyof PackageInclude, val: string) =>
    setDraft((d) => ({
      ...d,
      includes: d.includes.map((inc, idx) => (idx === i ? { ...inc, [field]: val } : inc)),
    }));

  return (
    <div className="bg-surface-hover border border-border rounded-xl p-5 space-y-3">
      <PackageImageField draft={draft} setDraft={setDraft} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["name", "ideal_for", "tag"] as const).map((key) => (
          <Field key={key} label={key.replace("_", " ")} className="capitalize">
            <Input
              type="text"
              value={draft[key] ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            />
          </Field>
        ))}
        <Field label="Price (AUD)">
          <Input
            type="number"
            value={draft.price_aud}
            onChange={(e) => setDraft((d) => ({ ...d, price_aud: Number(e.target.value) }))}
          />
        </Field>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-muted">Includes</span>
          <Button size="sm" variant="ghost" onClick={addInclude}>
            <IconPlus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {draft.includes.map((inc, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-24 shrink-0">
                <Input
                  placeholder="icon"
                  value={inc.icon}
                  onChange={(e) => updateInclude(i, "icon", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="description"
                  value={inc.text}
                  onChange={(e) => updateInclude(i, "text", e.target.value)}
                />
              </div>
              <Button size="sm" variant="danger" onClick={() => removeInclude(i)}>
                <IconX className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave} disabled={isPending}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function PackagesEditor({ initialItems }: { initialItems: Package[] }) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Package>(emptyPkg());
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const save = (updated: Package[]) => {
    setItems(updated);
    showLoading();
    startTransition(async () => {
      try {
        await savePackages(updated);
      } finally {
        hideLoading();
      }
    });
  };

  const commitEdit = () => {
    save(items.map((p, i) => (i === editing ? draft : p)));
    setEditing(null);
  };

  const commitAdd = () => {
    save([...items, draft]);
    setAdding(false);
    setDraft(emptyPkg());
  };

  const remove = (i: number) => {
    if (!window.confirm("Delete this package?")) return;
    save(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setAdding(true); setDraft(emptyPkg()); }} disabled={adding}>
          <IconPlus className="w-4 h-4" /> Add Package
        </Button>
      </div>
      {adding && (
        <PackageForm
          draft={draft}
          setDraft={setDraft}
          onSave={commitAdd}
          onCancel={() => setAdding(false)}
          isPending={isPending}
        />
      )}
      {items.map((pkg, i) => (
        <div key={pkg.id} className="bg-surface border border-border rounded-xl p-4">
          {editing === i ? (
            <PackageForm
              draft={draft}
              setDraft={setDraft}
              onSave={commitEdit}
              onCancel={() => setEditing(null)}
              isPending={isPending}
            />
          ) : (
            <div className="flex items-center gap-4">
              {pkg.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-text">{pkg.name}</span>
                  {pkg.tag && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{pkg.tag}</span>
                  )}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{pkg.ideal_for} · A${pkg.price_aud}</div>
                <div className="text-xs text-text-subtle mt-1">{pkg.includes.length} includes</div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => { setEditing(i); setDraft({ ...pkg }); }}>
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
    </div>
  );
}
