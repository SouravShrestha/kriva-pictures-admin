import { getCloudflareContext } from "@opennextjs/cloudflare";

interface KVBinding {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
}

function getBinding(name: "KP_DATA_TEST" | "KP_DATA_PROD"): KVBinding | null {
  try {
    const { env } = getCloudflareContext();
    const kv = (env as Record<string, unknown>)[name];
    return kv ? (kv as KVBinding) : null;
  } catch {
    return null;
  }
}

export async function kvGet<T>(
  ns: "test" | "prod",
  key: string,
  fallback: T
): Promise<T> {
  const kv = getBinding(ns === "test" ? "KP_DATA_TEST" : "KP_DATA_PROD");
  if (!kv) return fallback;
  const value = await kv.get<T>(key, "json");
  return value ?? fallback;
}

export async function kvSet<T>(
  ns: "test" | "prod",
  key: string,
  value: T
): Promise<void> {
  const kv = getBinding(ns === "test" ? "KP_DATA_TEST" : "KP_DATA_PROD");
  if (!kv) throw new Error("KV binding not available");
  await kv.put(key, JSON.stringify(value));
}

export async function kvPromote(key: string): Promise<void> {
  const testKv = getBinding("KP_DATA_TEST");
  const prodKv = getBinding("KP_DATA_PROD");
  if (!testKv || !prodKv) throw new Error("KV bindings not available");
  const value = await testKv.get<unknown>(key, "json");
  if (value !== null) {
    await prodKv.put(key, JSON.stringify(value));
  }
}

export const KV_KEYS = {
  testimonials: "testimonials",
  packages: "packages",
  faqs: "faqs",
  gallery: "gallery",
} as const;
