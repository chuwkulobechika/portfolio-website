import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Single-owner password login. The password and signing secret are Worker
// secrets (`wrangler secret put ADMIN_PASSWORD` / `SESSION_SECRET`).

export type AdminUser = {
  userId: string;
  displayName: string;
};

export const SESSION_COOKIE = "portfolio_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const OWNER: AdminUser = { userId: "owner", displayName: "Chukwulobe" };
const encoder = new TextEncoder();

function secrets(): { password: string; sessionSecret: string } | null {
  const password = env.ADMIN_PASSWORD;
  const sessionSecret = env.SESSION_SECRET;
  if (!password || !sessionSecret) return null;
  return { password, sessionSecret };
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const config = secrets();
  if (!config) return false;
  // Compare HMACs so the comparison length never depends on the password.
  const [expected, actual] = await Promise.all([
    hmac(config.sessionSecret, `pw:${config.password}`),
    hmac(config.sessionSecret, `pw:${candidate}`),
  ]);
  return timingSafeEqual(expected, actual);
}

export async function createSessionToken(): Promise<string> {
  const config = secrets();
  if (!config) throw new Error("ADMIN_PASSWORD and SESSION_SECRET must be set.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  return `${expires}.${await hmac(config.sessionSecret, `session:${expires}`)}`;
}

async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const config = secrets();
  if (!config || !token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return timingSafeEqual(signature, await hmac(config.sessionSecret, `session:${expires}`));
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  for (const part of (cookieHeader ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const requestHeaders = await headers();
  const token = readCookie(requestHeaders.get("cookie"), SESSION_COOKIE);
  return (await verifySessionToken(token)) ? OWNER : null;
}

export async function requireAdminUser(returnTo: string): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `/logout?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}

export function safeRelativeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (url.pathname === "/login" || url.pathname === "/logout") return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
