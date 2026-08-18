import { db } from "@/db";
import { users } from "@/db/schema";

let _userCache: Record<number, string> | null = null;
let _userCacheTime = 0;

export async function getUserMap(): Promise<Record<number, string>> {
  const now = Date.now();
  // Cache for 30 seconds
  if (_userCache && now - _userCacheTime < 30000) return _userCache;
  const allUsers = await db.select({ id: users.id, displayName: users.displayName, username: users.username }).from(users);
  const map: Record<number, string> = {};
  for (const u of allUsers) {
    map[u.id] = u.displayName || u.username;
  }
  _userCache = map;
  _userCacheTime = now;
  return map;
}
