import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./auth";

/**
 * Defence in depth for mutating server actions. `src/proxy.ts` already gates
 * every request, but server-action POSTs are an independent entry point, so
 * anything that writes to KV or Cloudinary re-checks the session itself.
 */
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    throw new Error("Not authenticated.");
  }
}
