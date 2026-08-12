"use server";

import { revalidatePath } from "next/cache";
import { listFolder, uploadAsset, copyAssetToProd, deleteAsset } from "@/lib/cloudinary";

const SECTION_FOLDER = "kp-sections";

export async function getSectionAssets() {
  return listFolder(SECTION_FOLDER, "test");
}

export async function replaceSectionImage(fileDataUrl: string, tag: string) {
  const asset = await uploadAsset(fileDataUrl, SECTION_FOLDER, "test", `${SECTION_FOLDER}/${tag}`);
  revalidatePath("/images/sections");
  return asset;
}

export async function promoteSections() {
  const testAssets = await listFolder(SECTION_FOLDER, "test");
  const prodAssets = await listFolder(SECTION_FOLDER, "prod");
  const prodPublicIds = new Set(prodAssets.map((a) => a.publicId));

  for (const asset of testAssets) {
    if (!prodPublicIds.has(asset.publicId)) {
      await copyAssetToProd(asset.secureUrl, SECTION_FOLDER);
    }
  }

  // Replace changed assets (same public_id, different content)
  for (const testAsset of testAssets) {
    const prodAsset = prodAssets.find((p) => p.publicId === testAsset.publicId);
    if (prodAsset && prodAsset.secureUrl !== testAsset.secureUrl) {
      await deleteAsset(prodAsset.publicId, "prod");
      await copyAssetToProd(testAsset.secureUrl, SECTION_FOLDER);
    }
  }
}
