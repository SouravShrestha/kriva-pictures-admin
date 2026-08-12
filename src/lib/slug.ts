/**
 * Slug + folder-path helpers for gallery categories and events.
 *
 * Folder paths are interpolated directly into Cloudinary public_ids and into
 * Admin API search expressions like `folder="test/kp-gallery/x"`, so every
 * segment has to be validated before it reaches those call sites — a stray
 * quote or slash would silently break the query instead of erroring.
 */

const MAX_SLUG_LENGTH = 60;

/**
 * Turns a human name into a URL/folder-safe slug.
 * "Tiny Wonders — 2024!" -> "tiny-wonders-2024"
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    // Strip combining marks so accented characters collapse to their base letter.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Appends -2, -3, … until the slug no longer collides with `existing`.
 */
export function uniqueSlug(base: string, existing: readonly string[]): string {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;

/**
 * Guards a single folder name (no slashes). Throws on anything that could
 * escape or break a Cloudinary path or search expression.
 */
export function assertSafeFolderSegment(segment: string): string {
  if (!segment || !SAFE_SEGMENT.test(segment)) {
    throw new Error(
      `Unsafe folder name: "${segment}". Use letters, numbers, spaces, hyphens or underscores only.`
    );
  }
  return segment;
}

/**
 * Guards a multi-segment folder path such as "kp-gallery/newborn/shailza".
 * Every segment is validated individually; empty segments (`//`, trailing `/`)
 * and traversal (`..`) are rejected.
 */
export function assertSafeFolderPath(path: string): string {
  if (!path) throw new Error("Folder path is required.");
  const segments = path.split("/");
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      throw new Error(`Unsafe folder path: "${path}".`);
    }
    assertSafeFolderSegment(segment);
  }
  return path;
}
