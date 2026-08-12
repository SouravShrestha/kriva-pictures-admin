"use server";

import { revalidatePath } from "next/cache";
import { kvGet, kvSet, KV_KEYS } from "@/lib/kv";
import {
  listFolder,
  uploadAsset,
  deleteAsset,
  copyAssetToProd,
  createFolder,
  type CloudinaryAsset,
} from "@/lib/cloudinary";
import { slugify, uniqueSlug, assertSafeFolderPath } from "@/lib/slug";
import {
  applyOrder,
  basename,
  categoryFolderFor,
  eventFolder,
  isKeepPlaceholder,
  normalizeCategories,
  requireCategory,
  requireEvent,
  resolveEventFolder,
} from "@/lib/gallery";
import { requireSession } from "@/lib/session";
import type {
  GalleryCategoryConfig,
  GalleryEventConfig,
  GalleryImageRef,
} from "@/types/gallery";

const KEY = KV_KEYS.gallery;

/* ------------------------------------------------------------------ reads */

export async function getGallery(): Promise<GalleryCategoryConfig[]> {
  const raw = await kvGet<GalleryCategoryConfig[]>("test", KEY, []);
  return normalizeCategories(raw);
}

export async function getCategory(
  categorySlug: string
): Promise<GalleryCategoryConfig | null> {
  const categories = await getGallery();
  return categories.find((c) => c.slug === categorySlug) ?? null;
}

/** Assets in an event folder, newest first, with the `.keep` placeholder hidden. */
export async function listEventAssets(
  categorySlug: string,
  eventSlug: string
): Promise<CloudinaryAsset[]> {
  const categories = await getGallery();
  const cat = requireCategory(categories, categorySlug);
  const ev = requireEvent(cat, eventSlug);
  const assets = await listFolder(resolveEventFolder(cat, ev), "test");
  return assets.filter((a) => !isKeepPlaceholder(a.publicId));
}

/* ----------------------------------------------------------- write helpers */

/**
 * Read-modify-write against KV. Everything funnels through here so the stored
 * value is always normalized and the client never posts a whole array back.
 */
async function mutate(
  fn: (categories: GalleryCategoryConfig[]) => void | Promise<void>
): Promise<GalleryCategoryConfig[]> {
  const categories = await getGallery();
  await fn(categories);
  const normalized = normalizeCategories(categories);
  await kvSet("test", KEY, normalized);
  return normalized;
}

function revalidateGallery(categorySlug?: string, eventSlug?: string) {
  revalidatePath("/data/gallery");
  if (categorySlug) revalidatePath(`/data/gallery/${categorySlug}`);
  if (categorySlug && eventSlug) {
    revalidatePath(`/data/gallery/${categorySlug}/${eventSlug}`);
  }
}

/* -------------------------------------------------------------- categories */

/**
 * Creates the JSON entry and the Cloudinary folder together. The folder path is
 * derived from the name and never changes afterwards.
 */
export async function addCategory(input: { name: string }): Promise<string> {
  await requireSession();
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required.");

  const categories = await getGallery();
  const base = slugify(name);
  if (!base) throw new Error("Category name must contain letters or numbers.");
  const slug = uniqueSlug(base, categories.map((c) => c.slug));
  const cloudinaryFolder = assertSafeFolderPath(categoryFolderFor(slug));

  await mutate((cats) => {
    cats.push({ slug, name, cloudinaryFolder, order: cats.length, events: [] });
  });

  await createFolder(cloudinaryFolder, "test");
  revalidateGallery(slug);
  return slug;
}

/** Renames a category for display only — `slug` and `cloudinaryFolder` are fixed. */
export async function updateCategory(
  categorySlug: string,
  patch: { name: string }
): Promise<void> {
  await requireSession();
  const name = patch.name.trim();
  if (!name) throw new Error("Category name is required.");

  await mutate((cats) => {
    requireCategory(cats, categorySlug).name = name;
  });
  revalidateGallery(categorySlug);
}

/**
 * Removes the category from the JSON only. Cloudinary images are left in place
 * so the deletion is recoverable by re-creating a category with the same name.
 */
export async function deleteCategory(categorySlug: string): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const i = cats.findIndex((c) => c.slug === categorySlug);
    if (i === -1) throw new Error(`Category "${categorySlug}" not found.`);
    cats.splice(i, 1);
  });
  revalidateGallery(categorySlug);
}

export async function reorderCategories(slugs: string[]): Promise<void> {
  await requireSession();
  const categories = await getGallery();
  const reordered = applyOrder(categories, slugs);
  await kvSet("test", KEY, normalizeCategories(reordered));
  revalidateGallery();
}

export async function setCategoryCover(
  categorySlug: string,
  cover: GalleryImageRef | null
): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const cat = requireCategory(cats, categorySlug);
    if (cover) cat.cover = cover;
    else delete cat.cover;
  });
  revalidateGallery(categorySlug);
}

/* ------------------------------------------------------------------ events */

/**
 * Creates the event's JSON entry and its Cloudinary sub-folder. The folder is
 * resolved from the stored category rather than trusted from the client.
 */
export async function addEvent(
  categorySlug: string,
  input: { name: string; date: string }
): Promise<string> {
  await requireSession();
  const name = input.name.trim();
  if (!name) throw new Error("Event name is required.");

  const categories = await getGallery();
  const cat = requireCategory(categories, categorySlug);
  const base = slugify(name);
  if (!base) throw new Error("Event name must contain letters or numbers.");
  const slug = uniqueSlug(base, cat.events.map((e) => e.slug));
  const folder = eventFolder(cat, slug);

  await mutate((cats) => {
    const target = requireCategory(cats, categorySlug);
    target.events.push({
      slug,
      name,
      date: input.date.trim(),
      order: target.events.length,
      folder,
    });
  });

  await createFolder(folder, "test");
  revalidateGallery(categorySlug, slug);
  return slug;
}

export async function updateEvent(
  categorySlug: string,
  eventSlug: string,
  patch: Partial<Pick<GalleryEventConfig, "name" | "date">>
): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const ev = requireEvent(requireCategory(cats, categorySlug), eventSlug);
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error("Event name is required.");
      ev.name = name;
    }
    if (patch.date !== undefined) ev.date = patch.date.trim();
  });
  revalidateGallery(categorySlug, eventSlug);
}

/** JSON-only delete; the Cloudinary folder and its images are left untouched. */
export async function deleteEvent(
  categorySlug: string,
  eventSlug: string
): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const cat = requireCategory(cats, categorySlug);
    const i = cat.events.findIndex((e) => e.slug === eventSlug);
    if (i === -1) throw new Error(`Event "${eventSlug}" not found.`);
    cat.events.splice(i, 1);
    // A category cover living inside the removed folder would dangle. publicIds
    // are root-prefixed ("test/kp-gallery/…"), hence the substring check.
    const folder = `${cat.cloudinaryFolder}/${eventSlug}/`;
    if (cat.cover?.publicId.includes(folder)) delete cat.cover;
  });
  revalidateGallery(categorySlug, eventSlug);
}

export async function reorderEvents(
  categorySlug: string,
  slugs: string[]
): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const cat = requireCategory(cats, categorySlug);
    cat.events = applyOrder(cat.events, slugs);
  });
  revalidateGallery(categorySlug);
}

export async function setEventCover(
  categorySlug: string,
  eventSlug: string,
  cover: GalleryImageRef | null
): Promise<void> {
  await requireSession();
  await mutate((cats) => {
    const cat = requireCategory(cats, categorySlug);
    const ev = requireEvent(cat, eventSlug);
    const previous = ev.cover;
    if (cover) ev.cover = cover;
    else delete ev.cover;
    // Keep the category cover in step when it mirrored this event's cover.
    if (previous && cat.cover?.publicId === previous.publicId) {
      if (cover) cat.cover = cover;
      else delete cat.cover;
    }
  });
  revalidateGallery(categorySlug, eventSlug);
}

/* ------------------------------------------------------------------ images */

export async function uploadGalleryImage(
  fileDataUrl: string,
  categorySlug: string,
  eventSlug: string
): Promise<CloudinaryAsset> {
  await requireSession();
  const categories = await getGallery();
  const cat = requireCategory(categories, categorySlug);
  const ev = requireEvent(cat, eventSlug);

  // No publicId, so Cloudinary auto-names and images accumulate in the folder
  // instead of overwriting each other.
  const asset = await uploadAsset(fileDataUrl, resolveEventFolder(cat, ev), "test");

  // First image in an event (or the whole category) automatically becomes the
  // cover, so `cover.secureUrl` is always safe to read once at least one image
  // exists instead of requiring a manual "Set cover" click.
  await mutate((cats) => {
    const target = requireCategory(cats, categorySlug);
    const targetEv = requireEvent(target, eventSlug);
    const cover: GalleryImageRef = { publicId: asset.publicId, secureUrl: asset.secureUrl };
    if (!targetEv.cover) targetEv.cover = cover;
    if (!target.cover) target.cover = cover;
  });

  revalidateGallery(categorySlug, eventSlug);
  return asset;
}

export async function deleteGalleryImage(
  publicId: string,
  categorySlug: string,
  eventSlug: string
): Promise<void> {
  await requireSession();
  const categories = await getGallery();
  const cat = requireCategory(categories, categorySlug);
  requireEvent(cat, eventSlug);

  await deleteAsset(publicId, "test");

  // If the deleted image was a cover, fall back to whatever image is left in
  // the folder (or drop the cover entirely when the folder is now empty).
  const remaining = (await listEventAssets(categorySlug, eventSlug)).filter(
    (a) => a.publicId !== publicId
  );
  const fallback: GalleryImageRef | undefined = remaining[0]
    ? { publicId: remaining[0].publicId, secureUrl: remaining[0].secureUrl }
    : undefined;

  await mutate((cats) => {
    const target = requireCategory(cats, categorySlug);
    const ev = requireEvent(target, eventSlug);
    if (ev.cover?.publicId === publicId) {
      if (fallback) ev.cover = fallback;
      else delete ev.cover;
    }
    if (target.cover?.publicId === publicId) {
      if (fallback) target.cover = fallback;
      else delete target.cover;
    }
  });
  revalidateGallery(categorySlug, eventSlug);
}

/** Explicit, separately-labelled bulk delete for an event folder's images. */
export async function deleteAllEventImages(
  categorySlug: string,
  eventSlug: string
): Promise<number> {
  await requireSession();
  const assets = await listEventAssets(categorySlug, eventSlug);
  for (const asset of assets) {
    await deleteAsset(asset.publicId, "test");
  }
  await mutate((cats) => {
    const cat = requireCategory(cats, categorySlug);
    const ev = requireEvent(cat, eventSlug);
    const removed = new Set(assets.map((a) => a.publicId));
    if (ev.cover && removed.has(ev.cover.publicId)) delete ev.cover;
    if (cat.cover && removed.has(cat.cover.publicId)) delete cat.cover;
  });
  revalidateGallery(categorySlug, eventSlug);
  return assets.length;
}

/* ----------------------------------------------------------------- promote */

/**
 * Mirrors the test gallery into prod: JSON plus every event folder's images.
 * Assets are matched across environments by basename, which is stable because
 * `copyAssetToProd` uploads by remote URL and Cloudinary derives the public_id
 * from the filename. Cover references are rewritten to their prod equivalents
 * so the live site never points at a test URL.
 */
export async function promoteGallery(): Promise<void> {
  const categories = await getGallery();
  const prodCategories: GalleryCategoryConfig[] = [];

  for (const cat of categories) {
    const prodEvents: GalleryEventConfig[] = [];
    // test publicId -> prod asset, across every event folder in this category,
    // so a category cover borrowed from any event can be resolved afterwards.
    const promotedByTestId = new Map<string, CloudinaryAsset>();

    for (const ev of cat.events) {
      const folder = resolveEventFolder(cat, ev);
      const [testAssets, prodAssets] = await Promise.all([
        listFolder(folder, "test"),
        listFolder(folder, "prod").catch(() => [] as CloudinaryAsset[]),
      ]);

      const liveTest = testAssets.filter((a) => !isKeepPlaceholder(a.publicId));
      const livePeer = prodAssets.filter((a) => !isKeepPlaceholder(a.publicId));

      // Drop prod assets that no longer exist in test.
      const testNames = new Set(liveTest.map((a) => basename(a.publicId)));
      for (const asset of livePeer) {
        if (!testNames.has(basename(asset.publicId))) {
          await deleteAsset(asset.publicId, "prod");
        }
      }

      // Copy across anything prod is missing, then record the pairing.
      const prodByName = new Map(
        livePeer
          .filter((a) => testNames.has(basename(a.publicId)))
          .map((a) => [basename(a.publicId), a])
      );
      for (const asset of liveTest) {
        const name = basename(asset.publicId);
        let peer = prodByName.get(name);
        if (!peer) {
          peer = await copyAssetToProd(asset.secureUrl, folder);
          prodByName.set(name, peer);
        }
        promotedByTestId.set(asset.publicId, peer);
      }

      const prodEvent: GalleryEventConfig = { ...ev };
      const cover = resolveProdCover(ev.cover, promotedByTestId);
      if (cover) prodEvent.cover = cover;
      else delete prodEvent.cover;
      prodEvents.push(prodEvent);
    }

    const prodCategory: GalleryCategoryConfig = { ...cat, events: prodEvents };
    // A cover that cannot be resolved to a prod asset is dropped rather than
    // left pointing at a test URL.
    const catCover = resolveProdCover(cat.cover, promotedByTestId);
    if (catCover) prodCategory.cover = catCover;
    else delete prodCategory.cover;

    prodCategories.push(prodCategory);
  }

  await kvSet("prod", KEY, prodCategories);
  revalidatePath("/promote");
}

function resolveProdCover(
  ref: GalleryImageRef | undefined,
  promoted: Map<string, CloudinaryAsset>
): GalleryImageRef | undefined {
  if (!ref) return undefined;
  const match = promoted.get(ref.publicId);
  if (!match) return undefined;
  return { publicId: match.publicId, secureUrl: match.secureUrl };
}

/** Counts assets that would be copied to prod, for the promote screen. */
export async function getGalleryAssetDiff(): Promise<number> {
  const categories = await getGallery();
  let pending = 0;
  for (const cat of categories) {
    for (const ev of cat.events) {
      const folder = resolveEventFolder(cat, ev);
      const [testAssets, prodAssets] = await Promise.all([
        listFolder(folder, "test"),
        listFolder(folder, "prod").catch(() => [] as CloudinaryAsset[]),
      ]);
      const testNames = new Set(
        testAssets.filter((a) => !isKeepPlaceholder(a.publicId)).map((a) => basename(a.publicId))
      );
      const prodNames = new Set(
        prodAssets.filter((a) => !isKeepPlaceholder(a.publicId)).map((a) => basename(a.publicId))
      );
      for (const name of testNames) if (!prodNames.has(name)) pending++;
      for (const name of prodNames) if (!testNames.has(name)) pending++;
    }
  }
  return pending;
}
