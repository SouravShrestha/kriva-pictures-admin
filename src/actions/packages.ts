"use server";

import { revalidatePath } from "next/cache";
import { kvGet, kvSet, KV_KEYS } from "@/lib/kv";
import { listFolder, uploadAsset, deleteAsset, copyAssetToProd } from "@/lib/cloudinary";
import type { Package } from "@/types/packages";

const KEY = KV_KEYS.packages;
const OTHERS_FOLDER = "kp-others";

export async function getPackages() {
  return kvGet<Package[]>("test", KEY, []);
}

export async function savePackages(items: Package[]) {
  await kvSet("test", KEY, items);
  revalidatePath("/data/packages");
}

// Uploads (or overwrites, if a package already has one) the image for a single
// package. Re-uploading for the same id overwrites the existing asset in place.
export async function uploadPackageImage(fileDataUrl: string, id: string) {
  const asset = await uploadAsset(fileDataUrl, OTHERS_FOLDER, "test", `${OTHERS_FOLDER}/${id}`);
  revalidatePath("/data/packages");
  return asset;
}

export async function promotePackages() {
  const testAssets = await listFolder(OTHERS_FOLDER, "test");
  const prodAssets = await listFolder(OTHERS_FOLDER, "prod");

  const basename = (publicId: string) => publicId.split("/").pop()!;
  const prodByBasename = new Map(prodAssets.map((a) => [basename(a.publicId), a]));

  const testItems = await kvGet<Package[]>("test", KEY, []);
  const relevantIds = new Set(testItems.map((item) => item.id));

  for (const testAsset of testAssets) {
    const key = basename(testAsset.publicId);
    if (!relevantIds.has(key)) continue; // asset belongs to another kp-others consumer (e.g. testimonials)

    const prodAsset = prodByBasename.get(key);
    if (!prodAsset) {
      const copied = await copyAssetToProd(testAsset.secureUrl, OTHERS_FOLDER);
      prodByBasename.set(key, copied);
    } else if (prodAsset.secureUrl !== testAsset.secureUrl) {
      await deleteAsset(prodAsset.publicId, "prod");
      const copied = await copyAssetToProd(testAsset.secureUrl, OTHERS_FOLDER);
      prodByBasename.set(key, copied);
    }
  }

  // Rewrite `image` on each package to point at its prod-hosted copy (matched by
  // package id in kp-others). Any other external URL is left untouched.
  const prodItems = testItems.map((item) => {
    const prodAsset = prodByBasename.get(item.id);
    return prodAsset ? { ...item, image: prodAsset.secureUrl } : item;
  });
  await kvSet("prod", KEY, prodItems);
}
