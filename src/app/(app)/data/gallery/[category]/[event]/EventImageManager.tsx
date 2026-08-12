"use client";

import { useEffect, useState } from "react";
import ImageGrid from "@/components/ImageGrid";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorBanner from "@/components/ErrorBanner";
import { useServerAction } from "@/components/useServerAction";
import { IconTrash } from "@/components/icons";
import {
  uploadGalleryImage,
  deleteGalleryImage,
  setEventCover,
  deleteAllEventImages,
} from "@/actions/gallery";

interface Asset {
  publicId: string;
  secureUrl: string;
}

export default function EventImageManager({
  categorySlug,
  eventSlug,
  initialAssets,
  initialCoverPublicId,
}: {
  categorySlug: string;
  eventSlug: string;
  initialAssets: Asset[];
  initialCoverPublicId: string | null;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [coverPublicId, setCoverPublicId] = useState(initialCoverPublicId);
  const [confirmingPurge, setConfirmingPurge] = useState(false);
  const { run, error, setError, isPending } = useServerAction();

  // Re-sync when the server component re-renders after a router.refresh().
  useEffect(() => setAssets(initialAssets), [initialAssets]);
  useEffect(() => setCoverPublicId(initialCoverPublicId), [initialCoverPublicId]);

  const handleUpload = async (fileDataUrl: string) => {
    await run(async () => {
      const asset = await uploadGalleryImage(fileDataUrl, categorySlug, eventSlug);
      setAssets((prev) => [asset, ...prev]);
      // The server sets the first upload as the cover automatically.
      setCoverPublicId((prev) => prev ?? asset.publicId);
    });
  };

  const handleDelete = async (publicId: string) => {
    await run(async () => {
      await deleteGalleryImage(publicId, categorySlug, eventSlug);
      setAssets((prev) => {
        const next = prev.filter((a) => a.publicId !== publicId);
        // Mirror the server's fallback: the next remaining image becomes the
        // cover, or there's no cover left once the folder is empty.
        setCoverPublicId((prevCover) =>
          prevCover === publicId ? next[0]?.publicId ?? null : prevCover
        );
        return next;
      });
    });
  };

  const handleSetCover = async (asset: Asset) => {
    await run(async () => {
      await setEventCover(categorySlug, eventSlug, {
        publicId: asset.publicId,
        secureUrl: asset.secureUrl,
      });
      setCoverPublicId(asset.publicId);
    });
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <ImageGrid
        assets={assets}
        onUpload={handleUpload}
        onDelete={handleDelete}
        uploading={isPending}
        coverPublicId={coverPublicId}
        onSetCover={handleSetCover}
      />

      {assets.length > 0 && (
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-text-subtle">
            Deleting the event from the category list keeps these images. Use this to remove
            them for good.
          </p>
          <Button
            size="sm"
            variant="danger"
            disabled={isPending}
            onClick={() => setConfirmingPurge(true)}
          >
            <IconTrash className="w-3.5 h-3.5" /> Delete all {assets.length} images
          </Button>
        </div>
      )}

      {confirmingPurge && (
        <ConfirmDialog
          message={`Permanently delete all ${assets.length} images in this folder? This cannot be undone.`}
          onCancel={() => setConfirmingPurge(false)}
          onConfirm={async () => {
            await run(async () => {
              await deleteAllEventImages(categorySlug, eventSlug);
              setAssets([]);
              setCoverPublicId(null);
            });
            setConfirmingPurge(false);
          }}
        />
      )}
    </div>
  );
}
