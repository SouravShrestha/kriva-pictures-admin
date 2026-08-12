/** Reference to a Cloudinary asset used as a cover image. */
export interface GalleryImageRef {
  publicId: string;
  secureUrl: string;
}

export interface GalleryEventConfig {
  slug: string;
  name: string;
  date: string;
  /** Display order within the category. Backfilled from array position when absent. */
  order?: number;
  /** Cover image for this event, picked from its own folder. */
  cover?: GalleryImageRef;
  /**
   * Cloudinary folder relative to the environment root, e.g.
   * "kp-gallery/newborn/shailza". Same root-relative path in test and prod.
   * Backfilled from `category.cloudinaryFolder + "/" + slug` when absent.
   */
  folder?: string;
}

export interface GalleryCategoryConfig {
  slug: string;
  name: string;
  /**
   * Cloudinary folder relative to the environment root, e.g. "kp-gallery/newborn".
   * Immutable once created — renaming a category only changes `name`.
   */
  cloudinaryFolder: string;
  /** Display order within the gallery. Backfilled from array position when absent. */
  order?: number;
  /** Cover image for this category, picked from its events' covers. */
  cover?: GalleryImageRef;
  events: GalleryEventConfig[];
}
