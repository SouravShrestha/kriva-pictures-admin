"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import { IconTrash, IconUpload, IconStar } from "@/components/icons";
import { compressImageToDataUrl } from "@/lib/image-compression";
import { withSimulatedProgress } from "@/lib/upload-progress";
import { useLoading } from "@/components/LoadingProvider";

interface Asset {
  publicId: string;
  secureUrl: string;
}

interface Props {
  assets: Asset[];
  onUpload: (fileDataUrl: string) => Promise<void>;
  onDelete: (publicId: string) => Promise<void>;
  uploading?: boolean;
  /**
   * Opt-in cover selection. When `onSetCover` is provided each tile gains a
   * "Cover" action and the current cover is badged. Omitted by callers that
   * have no concept of a cover (banners, sections).
   */
  coverPublicId?: string | null;
  onSetCover?: (asset: Asset) => Promise<void>;
}

export default function ImageGrid({
  assets,
  onUpload,
  onDelete,
  uploading,
  coverPublicId,
  onSetCover,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localAssets, setLocalAssets] = useState(assets);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { showLoading, hideLoading, setProgress } = useLoading();

  // Keep local state in sync when the parent's assets change (e.g. after a delete).
  useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    // Held open for the whole batch — each per-file onUpload also calls
    // showLoading/hideLoading around its own server action, but the overlay
    // is ref-counted so that only matters if this outer call weren't here;
    // holding it here prevents the count (and thus the overlay) from ever
    // dropping to zero between files.
    showLoading();
    try {
      // Upload sequentially so per-image failures don't abort the rest of the batch.
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const current = i + 1;
        const total = files.length;

        const dataUrl = await compressImageToDataUrl(file, {}, (percent) => {
          setProgress({ phase: "compressing", percent, current, total });
        });

        await withSimulatedProgress(
          () => onUpload(dataUrl),
          (percent) => setProgress({ phase: "uploading", percent, current, total }),
        );
      }
    } finally {
      setProgress(null);
      hideLoading();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <IconUpload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload Images"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {localAssets.length === 0 && (
        <div className="text-sm text-text-subtle py-8 text-center border-2 border-dashed border-border rounded-lg">
          No images yet. Upload one above.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {localAssets.map((asset) => {
          const isCover = !!coverPublicId && coverPublicId === asset.publicId;
          return (
            <div
              key={asset.publicId}
              className={`relative group aspect-square rounded-lg overflow-hidden border bg-surface-hover transition-all ${
                isCover ? "border-accent ring-2 ring-accent/40" : "border-border"
              }`}
            >
              <Image src={asset.secureUrl} alt="" fill className="object-cover" sizes="200px" unoptimized />

              {isCover && (
                <span className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <IconStar className="w-3 h-3" aria-hidden="true" /> Cover
                </span>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1.5">
                {onSetCover && !isCover && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-surface"
                    onClick={() => onSetCover(asset)}
                    aria-label="Set as cover image"
                  >
                    <IconStar className="w-3.5 h-3.5" />
                    Cover
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setPendingDeleteId(asset.publicId)}
                  aria-label="Delete image"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {pendingDeleteId && (
        <ConfirmDialog
          message="Delete this image? This cannot be undone."
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={async () => {
            await onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
