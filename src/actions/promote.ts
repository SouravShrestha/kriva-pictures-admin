"use server";

import { kvGet, KV_KEYS } from "@/lib/kv";
import { promoteBanners } from "./banners";
import { promoteSections } from "./sections";
import { promoteTestimonials } from "./testimonials";
import { promotePackages } from "./packages";
import { promoteFaqs } from "./faqs";
import { promoteGallery, getGalleryAssetDiff } from "./gallery";

export type PromoteKey =
  | "testimonials"
  | "packages"
  | "faqs"
  | "gallery"
  | "banners-home"
  | "banners-footer"
  | "banners-gallery"
  | "sections";

export async function getDiffCounts(): Promise<Record<PromoteKey, number>> {
  const keys: (keyof typeof KV_KEYS)[] = ["testimonials", "packages", "faqs", "gallery"];

  const [testValues, prodValues, galleryAssetDiff] = await Promise.all([
    Promise.all(keys.map((k) => kvGet("test", KV_KEYS[k], null))),
    Promise.all(keys.map((k) => kvGet("prod", KV_KEYS[k], null))),
    // Gallery is the one entity whose promote moves both JSON and images, so its
    // count includes assets pending copy/removal.
    getGalleryAssetDiff().catch(() => 0),
  ]);

  function diff(t: unknown, p: unknown) {
    const ts = JSON.stringify(t ?? []);
    const ps = JSON.stringify(p ?? []);
    if (ts === ps) return 0;
    const ta = Array.isArray(t) ? t : [];
    const pa = Array.isArray(p) ? p : [];
    return Math.abs(ta.length - pa.length) || 1;
  }

  return {
    testimonials: diff(testValues[0], prodValues[0]),
    packages: diff(testValues[1], prodValues[1]),
    faqs: diff(testValues[2], prodValues[2]),
    gallery: diff(testValues[3], prodValues[3]) + galleryAssetDiff,
    "banners-home": 0, // banner diff requires Cloudinary comparison, shown as manual
    "banners-footer": 0, // banner diff requires Cloudinary comparison, shown as manual
    "banners-gallery": 0, // banner diff requires Cloudinary comparison, shown as manual
    sections: 0, // section diff requires Cloudinary comparison, shown as manual
  };
}

export async function promoteSelected(selected: PromoteKey[]) {
  await Promise.all(
    selected.map(async (key) => {
      switch (key) {
        case "testimonials": return promoteTestimonials();
        case "packages": return promotePackages();
        case "faqs": return promoteFaqs();
        case "gallery": return promoteGallery();
        case "banners-home": return promoteBanners("kp-main-banner");
        case "banners-footer": return promoteBanners("kp-footer-banner");
        case "banners-gallery": return promoteBanners("kp-gallery-banner");
        case "sections": return promoteSections();
      }
    })
  );
}
