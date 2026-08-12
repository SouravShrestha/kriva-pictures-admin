/**
 * Pure helpers for the gallery config stored in KV. Kept free of server-only
 * imports so they can be reasoned about (and unit tested) in isolation.
 */

import { assertSafeFolderPath } from "./slug";
import type { GalleryCategoryConfig, GalleryEventConfig } from "@/types/gallery";

/** Root Cloudinary folder (relative to the env root) that holds every category. */
export const GALLERY_ROOT = "kp-gallery";

/** Placeholder object name used by createFolder(); never shown in the UI. */
export const KEEP_FILE = ".keep";

/** Folder for a brand new category with the given slug. */
export function categoryFolderFor(slug: string): string {
  return `${GALLERY_ROOT}/${slug}`;
}

/** Derives the full folder path of an event, validated before it reaches Cloudinary. */
export function eventFolder(
  category: Pick<GalleryCategoryConfig, "cloudinaryFolder">,
  eventSlug: string
): string {
  return assertSafeFolderPath(`${category.cloudinaryFolder}/${eventSlug}`);
}

/**
 * Resolves an event's folder path, preferring the stored `folder` field over
 * re-deriving it. The two only disagree for legacy entries written before the
 * field existed, which `normalizeCategories` backfills on the next read.
 */
export function resolveEventFolder(
  category: Pick<GalleryCategoryConfig, "cloudinaryFolder">,
  event: Pick<GalleryEventConfig, "slug" | "folder">
): string {
  return event.folder ?? eventFolder(category, event.slug);
}

/** Last path segment of a Cloudinary public_id, used to match test/prod assets. */
export function basename(publicId: string): string {
  return publicId.split("/").pop() ?? publicId;
}

/** Drops the `.keep` placeholder that createFolder() leaves behind on races. */
export function isKeepPlaceholder(publicId: string): boolean {
  const name = basename(publicId);
  return name === KEEP_FILE || name.startsWith(`${KEEP_FILE}.`);
}

function byOrder<T extends { order?: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ao = a.item.order ?? a.index;
      const bo = b.item.order ?? b.index;
      return ao === bo ? a.index - b.index : ao - bo;
    })
    .map(({ item }) => item);
}

/**
 * Sorts categories and their events by `order` and backfills any missing
 * `order` from the resulting position, so legacy KV entries written before
 * ordering existed get a stable sequence without a migration script.
 */
export function normalizeCategories(
  categories: GalleryCategoryConfig[]
): GalleryCategoryConfig[] {
  return byOrder(categories).map((cat, ci) => ({
    ...cat,
    order: ci,
    events: byOrder(cat.events ?? []).map((ev, ei) => ({
      ...ev,
      order: ei,
      folder: ev.folder ?? eventFolder(cat, ev.slug),
    })),
  }));
}

/**
 * Rewrites `order` to match the given slug sequence. Any item whose slug is
 * missing from `slugs` keeps its relative position at the end, so a stale
 * client list can never drop an entry.
 */
export function applyOrder<T extends { slug: string; order?: number }>(
  items: T[],
  slugs: readonly string[]
): T[] {
  const rank = new Map(slugs.map((slug, i) => [slug, i]));
  return items
    .map((item, index) => ({ item, index, rank: rank.get(item.slug) ?? slugs.length + index }))
    .sort((a, b) => (a.rank === b.rank ? a.index - b.index : a.rank - b.rank))
    .map(({ item }, i) => ({ ...item, order: i }) as T);
}

/** Returns the slug sequence with the item at `index` moved by `delta`. */
export function movedSlugs(
  items: readonly { slug: string }[],
  index: number,
  delta: -1 | 1
): string[] {
  const slugs = items.map((i) => i.slug);
  const target = index + delta;
  if (index < 0 || index >= slugs.length || target < 0 || target >= slugs.length) {
    return slugs;
  }
  [slugs[index], slugs[target]] = [slugs[target], slugs[index]];
  return slugs;
}

/** Finds a category by slug or throws a message the UI can surface as-is. */
export function requireCategory(
  categories: GalleryCategoryConfig[],
  slug: string
): GalleryCategoryConfig {
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) throw new Error(`Category "${slug}" not found.`);
  return cat;
}

/** Finds an event within a category or throws. */
export function requireEvent(
  category: GalleryCategoryConfig,
  slug: string
): GalleryEventConfig {
  const ev = category.events.find((e) => e.slug === slug);
  if (!ev) throw new Error(`Event "${slug}" not found in "${category.slug}".`);
  return ev;
}
