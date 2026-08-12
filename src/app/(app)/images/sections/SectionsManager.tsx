"use client";

import { useState, useTransition } from "react";
import SectionSlot from "@/components/SectionSlot";
import { replaceSectionImage } from "@/actions/sections";
import { useLoading } from "@/components/LoadingProvider";
import { withSimulatedProgress } from "@/lib/upload-progress";
import { compressImageToDataUrl } from "@/lib/image-compression";

interface Asset { publicId: string; secureUrl: string; }
interface Slot { label: string; tag: string; }

export default function SectionsManager({ slots, assets }: { slots: Slot[]; assets: Asset[] }) {
  const [, startTransition] = useTransition();
  const { showLoading, hideLoading, setProgress } = useLoading();
  const [urls, setUrls] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const slot of slots) {
      const asset = assets.find((a) => a.publicId.includes(slot.tag));
      initial[slot.tag] = asset?.secureUrl ?? null;
    }
    return initial;
  });

  const handleReplace = async (file: File, tag: string) => {
    showLoading();
    try {
      const dataUrl = await compressImageToDataUrl(file, {}, (percent) => {
        setProgress({ phase: "compressing", percent });
      });
      await new Promise<void>((resolve) => {
        startTransition(async () => {
          try {
            const asset = await withSimulatedProgress(
              () => replaceSectionImage(dataUrl, tag),
              (percent) => setProgress({ phase: "uploading", percent }),
            );
            // Bust the CDN/browser cache for this public_id since the URL itself is unchanged.
            setUrls((prev) => ({ ...prev, [tag]: `${asset.secureUrl}?v=${Date.now()}` }));
          } finally {
            resolve();
          }
        });
      });
    } finally {
      setProgress(null);
      hideLoading();
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {slots.map((slot) => (
        <SectionSlot
          key={slot.tag}
          label={slot.label}
          tag={slot.tag}
          currentUrl={urls[slot.tag] ?? null}
          onReplace={handleReplace}
        />
      ))}
    </div>
  );
}
