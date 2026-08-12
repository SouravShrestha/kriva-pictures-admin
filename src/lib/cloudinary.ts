import { env } from "./env";

type CloudflareEnv = "test" | "prod";

function rootFolder(cfEnv: CloudflareEnv): string {
  return cfEnv === "test"
    ? env.cloudinaryRootFolderTest
    : env.cloudinaryRootFolderProd;
}

function withRoot(folder: string, cfEnv: CloudflareEnv): string {
  const root = rootFolder(cfEnv);
  return root ? `${root}/${folder}` : folder;
}

function authHeader(): string {
  return "Basic " + btoa(`${env.cloudinaryApiKey}:${env.cloudinaryApiSecret}`);
}

export interface CloudinaryAsset {
  publicId: string;
  secureUrl: string;
  createdAt: string;
}

export async function listFolder(
  folder: string,
  cfEnv: CloudflareEnv
): Promise<CloudinaryAsset[]> {
  const all: CloudinaryAsset[] = [];
  let nextCursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      expression: `folder="${withRoot(folder, cfEnv)}"`,
      sort_by: [{ created_at: "desc" }],
      max_results: 500,
    };
    if (nextCursor) body.next_cursor = nextCursor;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/resources/search`,
      {
        method: "POST",
        headers: { Authorization: authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) throw new Error(`Cloudinary search failed: ${await res.text()}`);
    const data = await res.json() as {
      resources: { public_id: string; secure_url: string; created_at: string }[];
      next_cursor?: string;
    };
    for (const r of data.resources) {
      all.push({ publicId: r.public_id, secureUrl: r.secure_url, createdAt: r.created_at });
    }
    nextCursor = data.next_cursor;
  } while (nextCursor);

  return all;
}

async function sha1Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadAsset(
  fileData: string, // base64 data URI
  folder: string,
  cfEnv: CloudflareEnv,
  publicId?: string // relative public_id (already includes folder segment) for overwriting existing (section images)
): Promise<CloudinaryAsset> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const destFolder = withRoot(folder, cfEnv);

  // This account uses dynamic asset folders, where `asset_folder` (the folder shown in the
  // Media Library) is tracked separately from `public_id`. Sending `folder` together with
  // `public_id` causes Cloudinary to prepend the folder onto the public_id again (double
  // nesting), producing a brand new asset instead of overwriting the existing one. So when a
  // publicId is supplied, we send `public_id` + `asset_folder` only (no `folder` param) to
  // both overwrite the exact existing asset and keep it filed under the right folder.
  const paramsToSign: Record<string, string> = { timestamp, overwrite: "true", invalidate: "true" };
  if (publicId) {
    paramsToSign.public_id = withRoot(publicId, cfEnv);
    paramsToSign.asset_folder = destFolder;
  } else {
    paramsToSign.folder = destFolder;
  }

  const paramString = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");
  const signature = await sha1Hex(`${paramString}${env.cloudinaryApiSecret}`);

  const formData = new FormData();
  formData.append("file", fileData);
  formData.append("timestamp", timestamp);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("signature", signature);
  formData.append("overwrite", "true");
  formData.append("invalidate", "true");
  if (publicId) {
    formData.append("public_id", withRoot(publicId, cfEnv));
    formData.append("asset_folder", destFolder);
  } else {
    formData.append("folder", destFolder);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
  const data = await res.json() as { public_id: string; secure_url: string; created_at: string };
  return { publicId: data.public_id, secureUrl: data.secure_url, createdAt: data.created_at };
}

export async function deleteAsset(
  publicId: string,
  cfEnv: CloudflareEnv
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramString = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = await sha1Hex(`${paramString}${env.cloudinaryApiSecret}`);

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/destroy`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary delete failed: ${await res.text()}`);
  void cfEnv; // env not needed for delete (publicId already contains full path)
}

export async function copyAssetToProd(
  sourceUrl: string,
  destFolder: string
): Promise<CloudinaryAsset> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const destFolderFull = withRoot(destFolder, "prod");

  const paramString = `folder=${destFolderFull}&timestamp=${timestamp}`;
  const signature = await sha1Hex(`${paramString}${env.cloudinaryApiSecret}`);

  const formData = new FormData();
  formData.append("file", sourceUrl);
  formData.append("folder", destFolderFull);
  formData.append("timestamp", timestamp);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary copy failed: ${await res.text()}`);
  const data = await res.json() as { public_id: string; secure_url: string; created_at: string };
  return { publicId: data.public_id, secureUrl: data.secure_url, createdAt: data.created_at };
}

export async function createFolder(
  folderPath: string,
  cfEnv: CloudflareEnv
): Promise<void> {
  // Cloudflare creates folders implicitly on upload - we upload a placeholder
  // 1x1 transparent PNG and immediately delete it to create the folder structure
  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const asset = await uploadAsset(placeholder, folderPath, cfEnv, `${folderPath}/.keep`);
  await deleteAsset(asset.publicId, cfEnv);
}
