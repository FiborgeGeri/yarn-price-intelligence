import { NextRequest, NextResponse } from "next/server";

/**
 * API gatekeeper (edge runtime): verifies the HMAC-signed session cookie
 * for every /api request except login & health. Also blocks cross-origin
 * mutations and enforces role rules for admin-only endpoints.
 */

const SECRET = process.env.AUTH_SECRET || "fiborge-dev-secret-change-in-prod";

const PUBLIC_PATHS = ["/api/auth/login", "/api/health"];
const READ_ONLY_ROLES = new Set(["viewer", "visitor"]);

function b64url(bytes: ArrayBuffer): string {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

interface SessionClaims {
  id: number;
  username: string;
  displayName: string;
  role: string;
  exp: number;
}

async function verifyToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  if (sig !== expected) return null;
  try {
    const pad = "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob((payload + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as SessionClaims;
    if (!data?.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await verifyToken(req.cookies.get("fib_session")?.value);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  // Self-service auth endpoints stay open to every authenticated role.
  const isSelfServiceAuth = pathname.startsWith("/api/auth/logout") || pathname.startsWith("/api/auth/change-password");

  // CSRF-lite: mutations must originate from the same host.
  if (isMutation) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    // Read-only roles must not mutate business data.
    if (READ_ONLY_ROLES.has(session.role) && !isSelfServiceAuth) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
  }

  // Admin-only areas: user management is fully restricted; system settings
  // are readable by everyone (display preferences) but writable by admins.
  if (pathname.startsWith("/api/users") && session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  if (pathname.startsWith("/api/system-settings") && isMutation && session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
