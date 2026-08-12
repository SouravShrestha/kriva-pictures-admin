"use client";

import { useState, useTransition } from "react";
import ImageGrid from "@/components/ImageGrid";
import { uploadBanner, deleteBanner } from "@/actions/banners";
import { useLoading } from "@/components/LoadingProvider";

type BannerFolder = "kp-main-banner" | "kp-footer-banner" | "kp-gallery-banner";
interface Asset { publicId: string; secureUrl: string; }

export default function BannerManager({
  initialAssets,
  folder,
}: {
  initialAssets: Asset[];
  folder: BannerFolder;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [isPending, startTransition] = useTransition();
  const { showLoading, hideLoading } = useLoading();

  const handleUpload = async (fileDataUrl: string) => {
    showLoading();
    await new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const asset = await uploadBanner(fileDataUrl, folder);
          setAssets((prev) => [...prev, asset]);
        } finally {
          hideLoading();
          resolve();
        }
      });
    });
  };

  const handleDelete = async (publicId: string) => {
    showLoading();
    startTransition(async () => {
      try {
        await deleteBanner(publicId, folder);
        setAssets((prev) => prev.filter((a) => a.publicId !== publicId));
      } finally {
        hideLoading();
      }
    });
  };

  return (
    <ImageGrid
      assets={assets}
      onUpload={handleUpload}
      onDelete={handleDelete}
      uploading={isPending}
    />
  );
}
