"use server";

import { revalidatePath } from "next/cache";
import { kvGet, kvSet, kvPromote, KV_KEYS } from "@/lib/kv";
import type { FaqCategory } from "@/types/faq";

const KEY = KV_KEYS.faqs;

export async function getFaqs() {
  return kvGet<FaqCategory[]>("test", KEY, []);
}

export async function saveFaqs(items: FaqCategory[]) {
  await kvSet("test", KEY, items);
  revalidatePath("/data/faqs");
}

export async function promoteFaqs() {
  await kvPromote(KEY);
}
