/**
 * Client-side image compression, run in the browser before an image is
 * turned into a base64 data URL and sent through a server action to
 * Cloudinary. Nothing here touches the network — it's plain canvas
 * resizing + JPEG quality reduction, so it works fine on the Cloudflare
 * Workers runtime used server-side (this file is only ever imported from
 * "use client" components).
 *
 * Strategy, in order, until the encoded image is under `maxBytes`:
 *  1. Skip entirely if the file is already small enough, or isn't a type
 *     canvas can safely re-encode (GIF — would lose animation).
 *  2. Downscale to `maxDimension` on the longest side (cheap, doesn't
 *     affect visible quality much for typical camera/phone photos).
 *  3. Reduce JPEG quality in steps, but only down to `minQuality` — going
 *     lower tends to introduce visible artifacts, which is what we're
 *     trying to avoid.
 *  4. If still too big at `minQuality`, shrink dimensions further and
 *     retry from a fresh quality budget.
 *
 * PNGs are re-encoded as JPEG once resizing alone isn't enough, since
 * canvas ignores the quality param for PNG (it's lossless). This drops
 * alpha transparency, which is an acceptable trade-off for photos but
 * worth knowing about if you ever upload transparent PNGs (logos, etc).
 */

interface CompressOptions {
  /** Target size in bytes. Defaults to ~500KB. */
  maxBytes?: number;
  /** Cap on the longest side, in pixels. */
  maxDimension?: number;
  /** Never go below this quality (0-1) when re-encoding as JPEG. */
  minQuality?: number;
  /** Never shrink dimensions below this many pixels on the longest side. */
  minDimension?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxBytes: 500 * 1024,
  maxDimension: 2200,
  minQuality: 0.6,
  minDimension: 640,
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas failed to encode image"))),
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function drawScaled(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Max dimension-shrink attempts and quality steps per attempt — used to scale
 *  loop progress into a percentage for `onProgress`. Kept in sync with the
 *  loop bounds below (4 dimension attempts, quality 0.9 down to `minQuality`
 *  in steps of 0.1). */
const MAX_DIMENSION_ATTEMPTS = 4;
const MAX_QUALITY_STEPS = 4;
const MAX_TOTAL_STEPS = MAX_DIMENSION_ATTEMPTS * MAX_QUALITY_STEPS;

/**
 * Reads a File, compresses it toward `maxBytes` if needed, and resolves
 * with a base64 data URL — a drop-in replacement for
 * `FileReader.readAsDataURL` at every upload call site.
 *
 * `onProgress`, when provided, is called with a 0-100 estimate of how far
 * through the compression loop we are (real progress through the resize/
 * requality steps below, not a simulation).
 */
export async function compressImageToDataUrl(
  file: File,
  options: CompressOptions = {},
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { maxBytes, maxDimension, minQuality, minDimension } = { ...DEFAULTS, ...options };

  onProgress?.(0);

  // Already small enough — don't touch it, preserves full original quality.
  if (file.size <= maxBytes) {
    onProgress?.(100);
    return blobToDataUrl(file);
  }

  // Animated GIFs would lose their animation if re-encoded via canvas.
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    onProgress?.(100);
    return blobToDataUrl(file);
  }

  const img = await loadImage(file);
  onProgress?.(10);
  const originalLongSide = Math.max(img.width, img.height);
  let scale = Math.min(1, maxDimension / originalLongSide);
  let outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

  let blob: Blob | null = null;
  let stepsDone = 0;
  const reportStep = () => {
    stepsDone++;
    onProgress?.(10 + Math.min(90, Math.round((stepsDone / MAX_TOTAL_STEPS) * 90)));
  };

  for (let dimensionAttempt = 0; dimensionAttempt < MAX_DIMENSION_ATTEMPTS; dimensionAttempt++) {
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = drawScaled(img, width, height);

    // PNG ignores the quality parameter (lossless), so there's nothing to
    // step down — fall through to a JPEG re-encode below if it's still
    // too big after this single attempt.
    if (outputType === "image/png") {
      blob = await canvasToBlob(canvas, outputType, 1);
      reportStep();
      if (blob.size <= maxBytes) break;
      outputType = "image/jpeg";
      continue; // retry this same scale as JPEG before shrinking further
    }

    let quality = 0.9;
    while (quality >= minQuality) {
      blob = await canvasToBlob(canvas, outputType, quality);
      reportStep();
      if (blob.size <= maxBytes) break;
      quality -= 0.1;
    }

    if (blob && blob.size <= maxBytes) break;

    const longSide = Math.max(width, height);
    if (longSide <= minDimension) break; // can't shrink further, accept best effort
    scale = (Math.max(minDimension, longSide * 0.8)) / originalLongSide;
  }

  onProgress?.(100);
  if (!blob) return blobToDataUrl(file);
  return blobToDataUrl(blob);
}
