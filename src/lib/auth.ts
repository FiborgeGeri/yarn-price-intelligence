import crypto from "crypto";

/**
 * Signed session tokens (HMAC-SHA256).
 * The token is delivered as an httpOnly cookie so that every same-origin
 * request — including plain <a href> file downloads — is authenticated.
 */

const SECRET = process.env.AUTH_SECRET || "fiborge-dev-secret-change-in-prod";
export const SESSION_COOKIE = "fib_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

export function signSession(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | null | undefined): SessionUser | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.exp || Date.now() > data.exp) return null;
    return {
      id: data.id,
      username: data.username,
      displayName: data.displayName,
      role: data.role || "viewer",
    };
  } catch {
    return null;
  }
}

/** Extract and verify the session from a request's cookie header. */
export function getSession(req: Request): SessionUser | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return verifySession(match ? decodeURIComponent(match[1]) : null);
}

/** Convenience for route handlers: the current session user or null. */
export async function getCurrentUser(req?: Request): Promise<SessionUser | null> {
  if (!req) return null;
  return getSession(req);
}

export function canMutate(role: string | undefined): boolean {
  return role === "admin" || role === "editor";
}
