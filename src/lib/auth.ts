import { env } from "./env";

const COOKIE_NAME = "kp-admin-session";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signToken(): Promise<string> {
  const ts = Date.now().toString();
  const mac = await hmac(env.sessionSecret, `${ts}|admin`);
  return `${ts}|${mac}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const [ts, mac] = token.split("|");
    if (!ts || !mac) return false;
    if (Date.now() - Number(ts) > TOKEN_TTL_MS) return false;
    const expected = await hmac(env.sessionSecret, `${ts}|admin`);
    return expected === mac;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
