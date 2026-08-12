"use server";

import { revalidatePath } from "next/cache";
import { listFolder, uploadAsset, deleteAsset, copyAssetToProd } from "@/lib/cloudinary";

type BannerFolder = "kp-main-banner" | "kp-footer-banner" | "kp-gallery-banner";

function bannerPath(folder: BannerFolder) {
  switch (folder) {
    case "kp-main-banner": return "/banners/home";
    case "kp-footer-banner": return "/banners/footer";
    case "kp-gallery-banner": return "/banners/gallery";
  }
}

export async function getBannerAssets(folder: BannerFolder) {
  return listFolder(folder, "test");
}

export async function uploadBanner(fileDataUrl: string, folder: BannerFolder) {
  const asset = await uploadAsset(fileDataUrl, folder, "test");
  revalidatePath(bannerPath(folder));
  return asset;
}

export async function deleteBanner(publicId: string, folder: BannerFolder) {
  await deleteAsset(publicId, "test");
  revalidatePath(bannerPath(folder));
}

export async function promoteBanners(folder: BannerFolder) {
  const testAssets = await listFolder(folder, "test");
  const prodAssets = await listFolder(folder, "prod");

  // Delete prod assets that are no longer in test
  const testUrls = new Set(testAssets.map((a) => a.secureUrl));
  for (const asset of prodAssets) {
    if (!testUrls.has(asset.secureUrl)) {
      await deleteAsset(asset.publicId, "prod");
    }
  }

  // Copy new test assets to prod
  const prodPublicIds = new Set(prodAssets.map((a) => a.publicId.split("/").pop()!));
  for (const asset of testAssets) {
    const basename = asset.publicId.split("/").pop()!;
    if (!prodPublicIds.has(basename)) {
      await copyAssetToProd(asset.secureUrl, folder);
    }
  }

}
