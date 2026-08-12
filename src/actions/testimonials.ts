"use server";

import { revalidatePath } from "next/cache";
import { kvGet, kvSet, KV_KEYS } from "@/lib/kv";
import { listFolder, uploadAsset, deleteAsset, copyAssetToProd } from "@/lib/cloudinary";
import type { Testimonial } from "@/types/testimonials";

const KEY = KV_KEYS.testimonials;
const TESTIMONIALS_FOLDER = "kp-others";

export async function getTestimonials() {
  return kvGet<Testimonial[]>("test", KEY, []);
}

export async function saveTestimonials(items: Testimonial[]) {
  await kvSet("test", KEY, items);
  revalidatePath("/data/testimonials");
}

// Uploads (or overwrites, if a testimonial already has one) the photo for a single
// testimonial. Re-uploading for the same id overwrites the existing asset in place.
export async function uploadTestimonialImage(fileDataUrl: string, id: string) {
  const asset = await uploadAsset(fileDataUrl, TESTIMONIALS_FOLDER, "test", `${TESTIMONIALS_FOLDER}/${id}`);
  revalidatePath("/data/testimonials");
  return asset;
}

export async function promoteTestimonials() {
  const testAssets = await listFolder(TESTIMONIALS_FOLDER, "test");
  const prodAssets = await listFolder(TESTIMONIALS_FOLDER, "prod");

  const basename = (publicId: string) => publicId.split("/").pop()!;
  const prodByBasename = new Map(prodAssets.map((a) => [basename(a.publicId), a]));

  for (const testAsset of testAssets) {
    const key = basename(testAsset.publicId);
    const prodAsset = prodByBasename.get(key);
    if (!prodAsset) {
      const copied = await copyAssetToProd(testAsset.secureUrl, TESTIMONIALS_FOLDER);
      prodByBasename.set(key, copied);
    } else if (prodAsset.secureUrl !== testAsset.secureUrl) {
      await deleteAsset(prodAsset.publicId, "prod");
      const copied = await copyAssetToProd(testAsset.secureUrl, TESTIMONIALS_FOLDER);
      prodByBasename.set(key, copied);
    }
  }

  // Rewrite image_url on each testimonial to point at its prod-hosted copy (when the
  // image lives in kp-others, matched by testimonial id). Any other external URL is
  // left untouched.
  const testItems = await kvGet<Testimonial[]>("test", KEY, []);
  const prodItems = testItems.map((item) => {
    if (!item.id) return item;
    const prodAsset = prodByBasename.get(item.id);
    return prodAsset ? { ...item, image_url: prodAsset.secureUrl } : item;
  });
  await kvSet("prod", KEY, prodItems);
}
