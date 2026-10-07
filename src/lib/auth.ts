import { NextRequest } from "next/server";
import crypto from "crypto";

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  displayName?: string;
}

// 🆕 導出登入/登出需要的常數
export const SESSION_COOKIE = "fib_session";
export const COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天 (秒數)

const AUTH_SECRET = process.env.AUTH_SECRET || "fiborge-secret-key-at-least-32-chars-long";

/**
 * 驗證並解析 HMAC-SHA256 Session Token
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(json);

    // 檢查過期時間
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return {
      id: Number(payload.id ?? payload.userId),
      username: String(payload.username || ""),
      role: String(payload.role || "viewer"),
      displayName: payload.displayName ? String(payload.displayName) : undefined,
    };
  } catch {
    return null;
  }
}

// 別名導出，兼顧不同檔案引入名稱
export const verifySessionToken = verifySession;

/**
 * 簽發 Session Token
 */
export function signSession(user: SessionUser): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = {
    id: user.id,
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${sig}`;
}

// 別名導出
export const signSessionToken = signSession;

/**
 * 獲取當前登入用戶 Session
 */
export async function getSession(req?: NextRequest): Promise<SessionUser | null> {
  if (!req) return null;

  // 1. 從 NextRequest Cookies 讀取
  const cookie = req.cookies.get(SESSION_COOKIE)?.value || req.cookies.get("session")?.value;
  if (cookie) {
    return verifySession(cookie);
  }

  // 2. 從 Authorization Header 讀取
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifySession(authHeader.slice(7));
  }

  return null;
}